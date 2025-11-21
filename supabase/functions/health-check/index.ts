// supabase/functions/health-check/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Sửa lỗi 7006: Thêm kiểu ': Request' cho tham số req
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return new Response(
      JSON.stringify({
        status: "online",
        timestamp: new Date().toISOString(),
        message: "System Operational",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Sửa lỗi 18046: Ép kiểu error thành Error hoặc any để lấy message
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({ status: "error", error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
