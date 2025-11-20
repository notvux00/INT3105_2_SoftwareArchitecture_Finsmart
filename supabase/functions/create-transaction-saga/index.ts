import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Khởi tạo Supabase Client với quyền Admin (Service Role Key)
    // QUAN TRỌNG: Sử dụng SUPABASE_SERVICE_ROLE_KEY để có quyền ghi đè RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    );

    // 3. Lấy dữ liệu từ Frontend gửi lên
    const { user_id, wallet_id, category, amount, note, date, limit_id, type } = await req.json();

    // Validate dữ liệu cơ bản
    if (!user_id || !wallet_id || !amount || !date) {
      throw new Error("Thiếu thông tin giao dịch bắt buộc.");
    }

    console.log(`[SAGA START] Transaction for User: ${user_id}, Type: ${type}, Amount: ${amount}`);

    // BƯỚC 1: TẠO GIAO DỊCH (Transaction Record)
    const tableName = type === 'thu' ? 'income' : 'transactions';
    const transactionPayload: any = {
      user_id,
      wallet_id,
      category,
      amount,
      created_at: date,
      note
    };
    // Nếu là chi tiêu và có chọn hạn mức thì lưu thêm limit_id
    if (type === 'chi' && limit_id) transactionPayload.limit_id = limit_id;

    const { data: transData, error: transError } = await supabase
      .from(tableName)
      .insert([transactionPayload])
      .select()
      .single();

    if (transError) throw new Error(`Lỗi tạo giao dịch: ${transError.message}`);
    
    // Lưu lại ID để nếu cần rollback thì xóa
    const transactionId = transData.id || transData.transaction_id || transData.income_id;
    console.log(`[STEP 1 DONE] Created Transaction ID: ${transactionId}`);

    try {
        // BƯỚC 2: CẬP NHẬT SỐ DƯ VÍ (Wallet Balance)
        
        // Lấy số dư hiện tại
        const { data: wallet, error: walletFetchError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('wallet_id', wallet_id)
            .single();
        
        if (walletFetchError || !wallet) throw new Error("Không tìm thấy ví người dùng.");

        let newBalance = wallet.balance;
        if (type === 'thu') {
            newBalance += amount;
        } else {
            newBalance -= amount;
            // Kiểm tra số dư (Business Rule)
            if (newBalance < 0) throw new Error("Số dư không đủ để thực hiện giao dịch.");
        }

        const { error: walletUpdateError } = await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('wallet_id', wallet_id);

        if (walletUpdateError) throw new Error(`Lỗi cập nhật ví: ${walletUpdateError.message}`);
        console.log(`[STEP 2 DONE] Updated Wallet Balance.`);

        // BƯỚC 3: CẬP NHẬT HẠN MỨC (Budget/Limit) - Chỉ khi chi tiêu
        if (type === 'chi' && limit_id) {
            const { data: limit, error: limitFetchError } = await supabase
                .from('limit')
                .select('used, limit_amount, limit_name')
                .eq('limit_id', limit_id)
                .single();

            if (limitFetchError || !limit) throw new Error("Không tìm thấy hạn mức chi tiêu.");

            const newUsed = (limit.used || 0) + amount;
            
            // Kiểm tra vượt hạn mức (Business Rule)
            if (newUsed > limit.limit_amount) {
                 throw new Error(`Giao dịch này sẽ vượt quá hạn mức "${limit.limit_name}".`);
            }

            // Cập nhật và yêu cầu trả về dòng dữ liệu đã sửa (.select())
            const { data: updatedLimit, error: limitUpdateError } = await supabase
                .from('limit')
                .update({ used: newUsed })
                .eq('limit_id', limit_id)
                .select(); 

            if (limitUpdateError) throw new Error(`Lỗi cập nhật hạn mức: ${limitUpdateError.message}`);
            
            // KIỂM TRA QUAN TRỌNG: Đảm bảo thực sự có dòng được update
            if (!updatedLimit || updatedLimit.length === 0) {
                throw new Error("Lỗi dữ liệu: Không tìm thấy bản ghi hạn mức để cập nhật (Sai ID hoặc bị ẩn).");
            }

            console.log(`[STEP 3 DONE] Updated Limit Used Amount to ${newUsed}.`);
        }

    } catch (processError: any) {
        // COMPENSATING TRANSACTION (ROLLBACK / HOÀN TÁC)
        console.error(`[SAGA ERROR] Có lỗi xảy ra: "${processError.message}". Đang tiến hành hoàn tác...`);
        
        // 1. Hoàn tác Bước 1: Xóa giao dịch vừa tạo
        if (transactionId) {
             // Xóa dựa trên ID lấy được từ bước 1
             let deleteQuery = supabase.from(tableName).delete();
             
             if (transData.id) deleteQuery = deleteQuery.eq('id', transactionId);
             else if (transData.transaction_id) deleteQuery = deleteQuery.eq('transaction_id', transactionId);
             else if (transData.income_id) deleteQuery = deleteQuery.eq('income_id', transactionId);
             
             await deleteQuery;
             console.log("COMPENSATION: Đã xóa giao dịch rác.");
        }

        // 2. Hoàn tác Bước 2: Hoàn tiền ví (Nếu lỗi xảy ra ở Bước 3 - liên quan đến hạn mức)
        if (processError.message.includes("hạn mức") || processError.message.includes("Lỗi dữ liệu")) {
             const { data: currentWallet } = await supabase.from('wallets').select('balance').eq('wallet_id', wallet_id).single();
             if (currentWallet) {
                 // Trả lại tiền (cộng lại nếu là chi)
                 await supabase.from('wallets').update({ balance: currentWallet.balance + amount }).eq('wallet_id', wallet_id);
                 console.log("COMPENSATION: Đã hoàn tiền lại vào ví.");
             }
        }

        // Ném lỗi tiếp ra ngoài để Frontend nhận được thông báo
        throw processError;
    }

    // THÀNH CÔNG HOÀN TOÀN
    return new Response(
      JSON.stringify({ success: true, message: "Giao dịch thành công" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});