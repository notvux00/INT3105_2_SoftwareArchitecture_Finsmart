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

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

const redis = new Redis({
    url: UPSTASH_REDIS_URL,
    token: UPSTASH_REDIS_TOKEN,
});

const MAX_REQUESTS = 500;
const WINDOW_SECONDS = 60; 

async function checkRateLimit(userId: string | null, req: Request): Promise<boolean> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  console.log("Client IP:", ip);
  const identityKey = userId ? `u:${userId}-ip:${ip}` : `ip:${ip}`;

  const windowId = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const redisKey = `rate-limit:${identityKey}:${windowId}`;

  try {
    const currentCount = (await redis.incr(redisKey)) as number;

    const ttl = (await redis.ttl(redisKey)) as number;
    if (ttl === -1) {
      await redis.expire(redisKey, WINDOW_SECONDS);
    }

    console.log(
      `[RateLimit] ${identityKey} -> ${currentCount}/${MAX_REQUESTS}`
    );

    if (currentCount > MAX_REQUESTS) {
      console.log(">>> Rate limit exceeded → return false");
      return false;
    }

    return true;
  } catch (err) {
    console.error("Redis error → Skip rate limit", err);
    return true;
  }
}


Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { userId } = await req.json();

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "Missing userId" }), 
                { 
                    status: 400,
                    headers: { 
                        ...corsHeaders, 
                        'Content-Type': 'application/json' 
                    }
                }
            );
        }

        const isAllowed = await checkRateLimit(userId, req);

        if (!isAllowed) {
            return new Response(
                JSON.stringify({ error: "Rate Limit Exceeded" }), 
                { 
                    status: 429,
                    headers: { 
                        ...corsHeaders, 
                        'Content-Type': 'application/json' 
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "Allowed" }), 
            { 
                status: 200,
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json' 
                }
            }
        );

    } catch (e) {
        return new Response(
            JSON.stringify({ error: (e as Error).message }), 
            { 
                status: 500,
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json' 
                }
            }
        );
    }
});