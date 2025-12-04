// File: supabase/functions/login-limiting/index.ts

import bcrypt from "npm:bcryptjs@2.4.3";
import { Redis } from "npm:@upstash/redis@1.34.3";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

// CORS Headers, cái này lấy từ shared ở supabase/functions/shared/cors.ts cũng đc
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lấy biến môi trường
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SERVICE_KEY')!;
const UPSTASH_REDIS_URL = Deno.env.get('REDIS_REST_URL')!;
const UPSTASH_REDIS_TOKEN = Deno.env.get('REDIS_REST_TOKEN')!;

const MAX_ATTEMPTS_FOR_IP = 100;
const MAX_ATTEMPTS_FOR_EU = 10;

// Khởi tạo Supabase Admin Client và Upstash Redis
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
const redis = new Redis({
    url: UPSTASH_REDIS_URL,
    token: UPSTASH_REDIS_TOKEN,
});

async function checkRateLimit(ipAddress: string): Promise<number> {
    const key = `ip_limit:${ipAddress}`;
    const WINDOW_SECONDS = 60 * 10; // 10 phút

    // Sử dụng lệnh INCR và EXPIRE
    const attempts = await redis.incr(key) as number; 
    
    const ttl = await redis.ttl(key) as number;
    if (ttl === -1) {
        await redis.expire(key, WINDOW_SECONDS);
    }
    return attempts;
}

async function checkRateLimit_EU(ipAddress: string, username: string): Promise<number> {
    const key = `ip_limit:${ipAddress}:user:${username}`;
    const WINDOW_SECONDS = 120; // 2 phút

    // Sử dụng lệnh INCR và EXPIRE
    const attempts = await redis.incr(key) as number; 
    
    const ttl = await redis.ttl(key) as number;
    if (ttl === -1) {
        await redis.expire(key, WINDOW_SECONDS);
    }
    return attempts;
}

Deno.serve(async (req) => {
    console.log(123123123)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { 
            status: 405,
            headers: corsHeaders 
        });
    }
    console.log(`Incoming request from IP: ${req.headers.get('X-Real-IP') || req.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 'unknown'}`);
    try {
        const { username, password } = await req.json();

        // 1. LẤY IP VÀ RATE LIMIT
        const clientIp = req.headers.get('X-Real-IP') 
            || req.headers.get('X-Forwarded-For')?.split(',')[0].trim() 
            || 'unknown';

        const attempts = await checkRateLimit(clientIp); 
        if (attempts > MAX_ATTEMPTS_FOR_IP) {
            return new Response(
                JSON.stringify({ error: "Thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 2 phút." }), 
                { 
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const attempts_EU = await checkRateLimit_EU(clientIp, username); 
        if (attempts_EU > MAX_ATTEMPTS_FOR_EU) {
            return new Response(
                JSON.stringify({ error: "Thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 2 phút." }), 
                { 
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }


        

        // 2. TRUY VẤN CSDL VÀ XÁC THỰC BCrypt
        const { data, error } = await supabaseAdmin
            .from("users")
            .select("user_id, password_hash")
            .eq("user_name", username)
            .single();
        
        // Kiểm tra mật khẩu
        const isMatch = (data && await bcrypt.compare(password, data.password_hash));


        // 4. Xử lý Thất bại (Tăng bộ đếm và trả về lỗi 401)
        if (error || !data || !isMatch) {
            return new Response(
                JSON.stringify({ error: "Sai tài khoản hoặc mật khẩu." }), 
                { 
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 5. THÀNH CÔNG -> Ko reset rate limit vì có thể lạm dụng để dò mật khẩu
        // await redis.del(`ip_limit:${clientIp}`); // Không xóa để tránh lạm dụng
        return new Response(
            JSON.stringify({ 
                success: true,
                user_id: data.user_id,
            }),
            { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: 'Lỗi server' }),
            { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});