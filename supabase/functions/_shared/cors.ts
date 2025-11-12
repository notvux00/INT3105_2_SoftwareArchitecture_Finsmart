// Code cho supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Hoặc 'http://localhost:3000' cho chặt chẽ
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}