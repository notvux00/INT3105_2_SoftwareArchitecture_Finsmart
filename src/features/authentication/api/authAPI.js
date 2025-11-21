/**
 * Authentication feature API layer
 * Handles interactions with Supabase Auth and Edge Functions
 */
import { supabase } from "../../../shared";

// Lấy URL dự án từ biến môi trường
const SUPABASE_PROJECT_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://nvbdupcoynrzkrwyhrjc.supabase.co";

export const authAPI = {
  // Đăng nhập (Gọi Edge Function login-limiting)
  async login({ username, password }) {
    const EDGE_URL = `${SUPABASE_PROJECT_URL}/functions/v1/login-limiting`;

    const response = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.status !== 200) {
      throw new Error(result.error || "Đăng nhập thất bại");
    }

    return result; // Trả về { success: true, user_id: ... }
  },

  // Đăng ký (Gọi Edge Function register-limiting)
  async register({ email, password, username, fullName, dob, phone }) {
    const EDGE_URL = `${SUPABASE_PROJECT_URL}/functions/v1/register-limiting`;

    const response = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, password, username, fullName, dob, phone }),
    });

    const result = await response.json();

    if (response.status !== 200) {
      throw new Error(result.error || "Đăng ký thất bại");
    }

    // Tạo ví sau khi đăng ký thành công (Logic cũ của bạn)
    await this.createWallet(result.user_id || username); // Edge function trả về user_id hoặc ta query lại

    return result;
  },

  // Tạo ví (Hỗ trợ cho register)
  async createWallet(usernameOrId) {
    // Nếu tham số là username, cần query lấy ID trước
    let userId = usernameOrId;

    // Kiểm tra xem có phải ID không, nếu không thì query
    if (typeof usernameOrId === "string" && isNaN(Number(usernameOrId))) {
      const { data } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_name", usernameOrId)
        .single();
      if (data) userId = data.user_id;
    }

    if (!userId) return;

    const { error } = await supabase.from("wallets").insert([
      {
        user_id: userId,
        wallet_name: "Ví chính",
        balance: 0,
      },
    ]);

    if (error) console.error("Error creating wallet:", error);
  },

  async logout() {
    localStorage.removeItem("user_id");
  },
};
