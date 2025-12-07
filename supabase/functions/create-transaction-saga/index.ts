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

    // --- QUEUE PRODUCER LOGIC ---
    
    const payload = {
        user_id,
        wallet_id,
        category,
        amount,
        note,
        date,
        limit_id,
        type,
        idempotency_key,
        timestamp: Date.now()
    };

    // Push to Redis Queue (List)
    await redis.lpush('transaction_queue', payload);

    const successResult = { 
        success: true, 
        message: "Giao dịch đã được tiếp nhận và đang xử lý (Queue)", 
        queue_id: idempotency_key 
    };

    // Cache tạm thái "pending" nếu cần query lại
    await redis.set(`status:${idempotency_key}`, { status: 'queued' }, { ex: 300 });

    return new Response(JSON.stringify(successResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 202 // Accepted
    });

    /* 
       OLD SAGA LOGIC REMOVED - MOVED TO WORKER
       The direct DB writes are now handled by process-queue-worker
    */


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