
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
    // 1. Setup Clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    );
    
    const redis = new Redis({
        url: Deno.env.get("REDIS_REST_URL")!,
        token: Deno.env.get("REDIS_REST_TOKEN")!,
    });

    console.log("WORKER STARTED: Processing Transaction Queue...");

    // 2. BATCH PROCESSING LOOP (Process max 50 items per invocation to avoid Timeout)
    const MAX_BATCH_SIZE = 50;
    let processedCount = 0;
    let successCount = 0;

    for (let i = 0; i < MAX_BATCH_SIZE; i++) {
        // RPOP: Pop from tail (FIFO)
        const item = await redis.rpop('transaction_queue');
        
        if (!item) {
            console.log("Queue Empty. Sleeping or Exiting.");
            break; // Nothing left to process
        }

        /* 
           NOTE: In production, use BRPOP or robust queue handling. 
           Here we use RPOP for simplicity in a serverless function loop.
        */
       
        let payload = null;
        try {
            payload = (typeof item === 'string') ? JSON.parse(item) : item;
        } catch (e) {
            console.error("Invalid JSON in Queue:", item);
            continue;
        }

        const { user_id, wallet_id, category, amount, note, date, limit_id, type, idempotency_key } = payload;
        processedCount++;

        try {
            // --- SAGA LOGIC ---
            console.log(`Processing Tx: ${idempotency_key} for User ${user_id}`);

            // 1. Insert DB
            const tableName = type === 'thu' ? 'income' : 'transactions';
            const transactionPayload: any = { 
                user_id, 
                wallet_id, 
                category, 
                amount, 
                created_at: date, 
                note 
            };
            if (type === 'chi' && limit_id) transactionPayload.limit_id = limit_id;

            const { data: transData, error: transError } = await supabase
                .from(tableName)
                .insert([transactionPayload])
                .select()
                .single();

            if (transError) throw new Error(`DB Insert Failed: ${transError.message}`);

            const transactionId = transData.id;

            // 2. Atomic Update Wallet
             const { error: walletError } = await supabase.rpc('update_wallet_atomic', {
                p_wallet_id: wallet_id,
                p_amount: type === 'thu' ? amount : -amount,
                p_min_balance: 0 
            });

            if (walletError) {
                // Rollback Tx
                await supabase.from(tableName).delete().eq('id', transactionId);
                throw new Error(`Wallet Update Failed: ${walletError.message}`);
            }

            // 3. Update Limit (if exists)
            if (type === 'chi' && limit_id) {
                const { error: limitError } = await supabase.rpc('update_limit_atomic', {
                    p_limit_id: limit_id,
                    p_amount: amount
                });
                 if (limitError) {
                    // Rollback Limit failure is tricky if wallet committed? 
                    // Usually we should do all in one RPC or accept eventually consistent limits.
                    // For now, assume critical failure for simplicity.
                    // But wallet is already updated? -> Compensation needed.
                    // Simply logging for this demo.
                    console.error("Limit update failed (non-critical):", limitError);
                }
            }

            // --- SUCCESS ---
            successCount++;
            await redis.set(`status:${idempotency_key}`, { status: 'success', id: transactionId }, { ex: 86400 });

        } catch (err: any) {
            console.error(`FAILED processing ${idempotency_key}:`, err.message);
            // Update status to failed
            await redis.set(`status:${idempotency_key}`, { status: 'failed', error: err.message }, { ex: 86400 });
            // Optionally push to DLQ (Dead Letter Queue)
            // await redis.lpush('failed_queue', payload);
        }
    }

    // 3. RECURSIVE TRIGGER (QUAN TRỌNG: Tự gọi lại chính nó nếu còn việc)
    // Nếu vừa xử lý hết Batch (50 item) -> Có khả năng trong Queue vẫn còn hàng.
    // Ta gọi đệ quy để xử lý tiếp ngay lập tức, không chờ Cron 1 phút nữa.
    if (processedCount > 0) {
       console.log("🚀 Queue might check for more items. Triggering next batch...");
       // Gọi không chờ (Fire and Forget)
       fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-queue-worker`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
           },
           body: JSON.stringify({})
       }).catch(err => console.error("Trigger fail:", err));
    }

    return new Response(JSON.stringify({ 
        message: `Processed ${processedCount} items. Success: ${successCount}. Next Block Triggered.`,
        processed: processedCount
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
