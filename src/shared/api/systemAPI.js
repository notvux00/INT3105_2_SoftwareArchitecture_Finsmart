// src/shared/api/systemAPI.js
const SUPABASE_PROJECT_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://nvbdupcoynrzkrwyhrjc.supabase.co";

export const systemAPI = {
  async checkHealth() {
    const controller = new AbortController();
    // Timeout sau 5 giây nếu server không phản hồi
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${SUPABASE_PROJECT_URL}/functions/v1/health-check`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Server Error");
      return true; // Server sống
    } catch (error) {
      throw error; // Server chết hoặc mạng lỗi
    }
  },
};
