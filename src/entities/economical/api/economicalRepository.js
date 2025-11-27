import { supabase } from "../../../shared";
import {retryWrapper} from "../../retryWrapper"
async function retryWrapper(fn, maxRetries = 3, delayMs = 500) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log("dang o lan thu i");
      return await fn(); 
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error(`API failed after ${maxRetries} attempts.`, error);
        throw error;
      }
      console.warn(`Attempt ${i + 1}/${maxRetries} failed. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}



export const economicalRepository = {
  // Lấy danh sách mục tiêu
  async fetchGoals(userId) {
    console.log("fetch ok")
    const apiCall = async () => {
      const { data, error } = await supabase
        .from("economical")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    };

    return retryWrapper(apiCall);
  },

  // Thêm mục tiêu mới
  async addGoal(goalData) {
      console.log("da them goal")
      const { data, error } = await supabase
        .from("economical")
        .insert([goalData])
        .select()
        .single();

      if (error) throw error;
      return data;
  },

  // Cập nhật thông tin mục tiêu (Sửa tên, hạn, số tiền đích)
  async updateGoal(goalId, updates) {
    console.log("da update goal")
      const { data, error } = await supabase
        .from("economical")
        .update(updates)
        .eq("id", goalId)
        .select()
        .single();

      if (error) throw error;
      return data;
  },

  // Xóa mục tiêu
  async deleteGoal(goalId) {
      const apiCall = async () => {
        const { error } = await supabase
          .from("economical")
          .delete()
          .eq("id", goalId);

        if (error) throw error;
        return true;
      };

      return retryWrapper(apiCall);
  },

  // Nạp tiền vào mục tiêu (Cập nhật số tiền hiện tại)
  async depositToGoal(goalId, newAmount, newStatus) {
      console.log("da nap tien")
      const { data, error } = await supabase
        .from("economical")
        .update({ current_amount: newAmount, status: newStatus })
        .eq("id", goalId)
        .select()
        .single();

      if (error) throw error;
      return data;
  },
};
