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

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 180; // 3p

// Khởi tạo Supabase Admin Client và Upstash Redis
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
const redis = new Redis({
    url: UPSTASH_REDIS_URL,
    token: UPSTASH_REDIS_TOKEN,
});

async function checkRateLimit_DangKy(ipAddress: string): Promise<number> {
    const key = `register_ip_limit:${ipAddress}`;
    const attempts = await redis.get(key) as number | null;
    return attempts ?? 0;
}

async function incrementRateLimit_DangKy(ipAddress: string): Promise<void> {
    const key = `register_ip_limit:${ipAddress}`;
    const WINDOW_SECONDS = 180; // 3p

    const attempts = await redis.incr(key) as number;
    if (attempts == 1) {
        await redis.expire(key, WINDOW_SECONDS);
    }
    else if (attempts <= 0) {
        await redis.set(key, 1, { ex: WINDOW_SECONDS });
    }
    return;
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

        const {email, password, username, fullName, dob, phone} = await req.json();

        // test data xem ok ko
        if (!email || !password || !username || !fullName || !dob || !phone) {
            return new Response(
                JSON.stringify({ error: "Vui lòng điền đầy đủ thông tin." }), 
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
            );
        }

        // 1. LẤY IP VÀ RATE LIMIT
        const clientIp = req.headers.get('X-Real-IP') 
            || req.headers.get('X-Forwarded-For')?.split(',')[0].trim()
            || 'unknown';

        const attempts = await checkRateLimit_DangKy(clientIp); 
        console.log('Register attempts from IP', clientIp, attempts);
        if (attempts >= MAX_ATTEMPTS) {
            return new Response(
                JSON.stringify({ error: `Đã đạt giới hạn đăng ký, thử lại sau 3 phút` }), 
                { 
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // +1 vao rate limiting
        await incrementRateLimit_DangKy(clientIp);

        // 2. TRUY VẤN CSDL VÀ XÁC THỰC BCrypt
        const { data: existingUser, error: checkError } = await supabaseAdmin
        .from("users")
        .select("user_id")
        .eq("user_name", username)
        .single();

        if (existingUser) {
          return new Response(
            JSON.stringify({ error: "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác." }), 
            { 
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
        }

        // Băm mật khẩu với bcryptjs (10 rounds)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
      
        // Lưu user vào Supabase
        const { data, error } = await supabaseAdmin
        .from("users").insert([
          {
            email: email,
            password_hash: passwordHash,
            user_name: username,
            full_name: fullName,
            date_of_birth: dob,
            phone_number: phone,
          },
        ]).select();

        // 4. Xử lý Thất bại
        if (error) {
            return new Response(
                JSON.stringify({ error: error?.message || "Đăng ký thất bại." }), 
                { 
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 5.  bú, dang ky thanh cong
        return new Response(
            JSON.stringify({ message: "Đăng ký thành công." }), 
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