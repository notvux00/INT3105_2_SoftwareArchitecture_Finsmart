// supabase/functions/rl-check/index.ts
import { Redis } from "npm:@upstash/redis@1.34.3";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lấy biến môi trường
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SERVICE_KEY')!;
const UPSTASH_REDIS_URL = Deno.env.get('REDIS_REST_URL')!;
const UPSTASH_REDIS_TOKEN = Deno.env.get('REDIS_REST_TOKEN')!;

// Khởi tạo Supabase Admin Client và Upstash Redis
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

const redis = new Redis({
    url: UPSTASH_REDIS_URL,
    token: UPSTASH_REDIS_TOKEN,
});

const MAX_REQUESTS = 100;
const WINDOW_SECONDS = 60; 

async function checkRateLimit(userId: string): Promise<boolean> {
    if (!userId) return false;
    
    const windowId = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
    const redisKey = `rate-limit:user:${userId}:${windowId}`; 

    try {
        const pipeline = redis.pipeline();
        pipeline.incr(redisKey);
        pipeline.expire(redisKey, WINDOW_SECONDS);
        
        // Execute pipeline và lấy kết quả INCR (giá trị mới của bộ đếm)
        const [incrResult] = await pipeline.flush();
        const currentCount = incrResult.value as number;

        if (currentCount > MAX_REQUESTS) {
            return false; // Bị giới hạn
        }
        console.log("ok rate limting cho qua")
        return true; // Được phép
        
    } catch (error) {
        console.error("Redis error, skipping Rate Limit check:", error);
        return true; 
    }
}


Deno.serve(async (req) => {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
        }

        const isAllowed = await checkRateLimit(userId);

        if (!isAllowed) {
            return new Response("Rate Limit Exceeded", { status: 429 });
        }

        return new Response("Allowed", { status: 200 });

    } catch (e) {
        return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
    }
});