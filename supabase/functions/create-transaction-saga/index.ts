import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Redis } from "https://esm.sh/@upstash/redis@1.34.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 1. Setup Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    );
    
    // Init Redis with error handling
    const redis = new Redis({
        url: Deno.env.get("REDIS_REST_URL")!,
        token: Deno.env.get("REDIS_REST_TOKEN")!,
    });

    const { user_id, wallet_id, category, amount, note, date, limit_id, type, idempotency_key } = await req.json();

    // 2. INPUT VALIDATION
    if (!idempotency_key) {
        throw new Error("Missing idempotency_key");
    }
    if (!user_id || !wallet_id || !type) {
        throw new Error("Missing required fields: user_id, wallet_id, type");
    }
    if (!amount || amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }
    if (!['thu', 'chi'].includes(type)) {
        throw new Error("Type must be 'thu' or 'chi'");
    }

    // 3. IDEMPOTENCY CHECK (với Redis fallback)
    const cacheKey = `saga:${idempotency_key}`;
    let cachedResult = null;
    
    try {
        cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
            console.log('[IDEMPOTENT] Returning cached result');
            return new Response(JSON.stringify(cachedResult), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: cachedResult.success ? 200 : 400
            });
        }
    } catch (redisError) {
        console.warn('[REDIS WARNING] Cache check failed, continuing without cache:', redisError);
        // Tiếp tục xử lý bình thường nếu Redis down
    }

    // --- BẮT ĐẦU SAGA ---
    
    // BƯỚC 1: TẠO TRANSACTION (Write-Ahead Log)
    const tableName = type === 'thu' ? 'income' : 'transactions';
    const transactionPayload: any = { 
        user_id, 
        wallet_id, 
        category, 
        amount, 
        created_at: date, 
        note 
    };
    if (type === 'chi' && limit_id) {
        transactionPayload.limit_id = limit_id;
    }

    const { data: transData, error: transError } = await supabase
      .from(tableName)
      .insert([transactionPayload])
      .select()
      .single();

    if (transError) {
        throw new Error(`Failed to create transaction: ${transError.message}`);
    }
    
    // ✅ FIX: Cả 2 bảng đều dùng cột 'id' làm primary key
    const transactionId = transData.id;

    try {
        // BƯỚC 2: ATOMIC UPDATE WALLET
        const { error: walletError } = await supabase.rpc('update_wallet_atomic', {
            p_wallet_id: wallet_id,
            p_amount: type === 'thu' ? amount : -amount,
            p_min_balance: 0  // Không cho phép số dư âm
        });
        
        if (walletError) {
            // Cải thiện error message
            if (walletError.message.includes('Insufficient') || walletError.message.includes('balance')) {
                throw new Error('Số dư ví không đủ để thực hiện giao dịch');
            }
            throw new Error(`Wallet update failed: ${walletError.message}`);
        }

        // BƯỚC 3: ATOMIC UPDATE LIMIT (Nếu là chi tiêu và có limit)
        if (type === 'chi' && limit_id) {
            const { error: limitError } = await supabase.rpc('update_limit_atomic', {
                p_limit_id: limit_id,
                p_amount: amount
            });
            
            if (limitError) {
                if (limitError.message.includes('exceed') || limitError.message.includes('limit')) {
                    throw new Error('Giao dịch vượt quá hạn mức cho phép');
                }
                throw new Error(`Limit update failed: ${limitError.message}`);
            }
        }

        // --- THÀNH CÔNG ---
        const successResult = { 
            success: true, 
            message: "Giao dịch thành công", 
            id: transactionId,
            type: type 
        };
        
        // Lưu kết quả SUCCESS vào Redis (24h)
        try {
            await redis.set(cacheKey, successResult, { ex: 86400 });
        } catch (cacheError) {
            console.warn('[REDIS WARNING] Failed to cache success result:', cacheError);
            // Không throw error, transaction đã thành công
        }

        return new Response(JSON.stringify(successResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 200
        });

    } catch (processError: any) {
        // --- COMPENSATING TRANSACTION (ROLLBACK) ---
        console.error(`SAGA ERROR: ${processError.message}. Rolling back transaction ${transactionId}...`);
        
        try {
            // ✅ FIX: Dùng 'id' thay vì 'income_id'/'transaction_id'
            await supabase.from(tableName).delete().eq('id', transactionId);
            console.log(`[ROLLBACK] Successfully deleted transaction ${transactionId}`);
        } catch (deleteError) {
            console.error(`[ROLLBACK FAILED] Could not delete transaction ${transactionId}:`, deleteError);
            // Ghi log để manual cleanup sau
        }
        
        // Cache kết quả THẤT BẠI (TTL ngắn hơn - 5 phút)
        const errorResult = { 
            success: false, 
            error: processError.message,
            transaction_id: transactionId 
        };
        
        try {
            await redis.set(cacheKey, errorResult, { ex: 300 }); // 5 minutes
        } catch (cacheError) {
            console.warn('[REDIS WARNING] Failed to cache error result:', cacheError);
        }
        
        // Không cần rollback ví/limit vì dùng RPC atomic:
        // Nếu RPC lỗi, Postgres tự động rollback (không commit thay đổi số dư)
        
        throw processError;
    }

  } catch (error: any) {
    console.error('[SAGA FUNCTION ERROR]:', error);
    return new Response(JSON.stringify({ 
        success: false,
        error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400
    });
  }
});