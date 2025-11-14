// supabase/functions/process-periodic-transactions/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// ĐÂY LÀ DÒNG ĐÃ SỬA: dùng 'deno.land'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// Định nghĩa CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Hàm này được sao chép từ Preodic.js
const calculateNextExecution = (startDate, frequency)=>{
  const now = new Date();
  let date = new Date(startDate);
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  switch(frequency){
    case "3 phút":
      date = new Date();
      date.setMinutes(date.getMinutes() + 3);
      break;
    case "Hàng ngày":
      date.setDate(date.getDate() + 1);
      break;
    case "Hàng tuần":
      date.setDate(date.getDate() + 7);
      break;
    case "Hàng tháng":
      date.setMonth(date.getMonth() + 1);
      break;
    case "Hàng quý":
      date.setMonth(date.getMonth() + 3);
      break;
    case "Hàng năm":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString();
};
// Hàm này là phiên bản backend của processPeriodicTransactions
async function processPeriodicTransactions(supabaseAdmin) {
  const nowISO = new Date().toISOString();
  let processedCount = 0;
  let errorCount = 0;
  // 1. Lấy các task định kỳ đã đến hạn
  const { data: periodicList, error } = await supabaseAdmin.from("preodic").select("*").lte("next_execution", nowISO) // Task đã đến hạn
  .eq("is_active", true); // Task đang hoạt động
  if (error) {
    console.error("Lỗi khi lấy danh sách định kỳ:", error);
    throw new Error("Lỗi khi lấy danh sách định kỳ: " + error.message);
  }
  if (!periodicList || periodicList.length === 0) {
    console.log("Không có giao dịch định kỳ nào cần xử lý.");
    return {
      processed: 0,
      errors: 0,
      message: "Không có giao dịch định kỳ nào cần xử lý."
    };
  }
  console.log(`Tìm thấy ${periodicList.length} task định kỳ cần xử lý...`);
  for (const item of periodicList){
    try {
      // 2. Kiểm tra số dư ví
      const { data: wallet, error: walletError } = await supabaseAdmin.from("wallets").select("balance").eq("wallet_id", item.wallet_id).single();
      if (walletError || wallet.balance < item.amount) {
        console.warn(`Không đủ số dư cho task ${item.name_preodic} (ID: ${item.id}). Tạm dừng task.`);
        // Tạm dừng task nếu không đủ tiền
        await supabaseAdmin.from("preodic").update({
          is_active: false
        }).eq("id", item.id);
        errorCount++;
        continue;
      }
      // 3. Trừ tiền từ ví
      const newBalance = wallet.balance - item.amount;
      await supabaseAdmin.from("wallets").update({
        balance: newBalance
      }).eq("wallet_id", item.wallet_id);
      // 4. Ghi log giao dịch (thêm vào bảng transactions)
      await supabaseAdmin.from("transactions").insert([
        {
          created_at: new Date().toISOString(),
          user_id: item.user_id,
          wallet_id: item.wallet_id,
          category: item.name_preodic || "Định kỳ",
          amount: item.amount,
          note: `Gia hạn định kỳ: ${item.name_preodic}`
        }
      ]);
      // 5. Cập nhật ngày thực thi tiếp theo (next_execution)
      const nextExec = calculateNextExecution(item.next_execution, item.frequency);
      // Kiểm tra xem đã hết hạn chưa
      if (new Date(item.endDate) < new Date()) {
        await supabaseAdmin.from("preodic").update({
          is_active: false
        }) // Hết hạn, tắt task
        .eq("id", item.id);
      } else {
        await supabaseAdmin.from("preodic").update({
          next_execution: nextExec
        }) // Hẹn lịch cho lần tiếp theo
        .eq("id", item.id);
      }
      processedCount++;
    } catch (err) {
      console.error(`Lỗi khi xử lý task ${item.id}: ${err.message}`);
      errorCount++;
    }
  }
  return {
    processed: processedCount,
    errors: errorCount,
    message: "Hoàn tất xử lý task định kỳ."
  };
}
// Khởi tạo server
serve(async (req)=>{
  // Xử lý CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 1. Bảo mật: Chỉ cho phép Cron Job gọi
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 2. Tạo Admin Client (dùng Service Role Key)
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SERVICE_KEY'));
    // 3. Chạy logic nghiệp vụ
    const result = await processPeriodicTransactions(supabaseAdmin);
    // 4. Trả về kết quả
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
