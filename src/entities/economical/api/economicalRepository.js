import { supabase } from "../../../shared";

export const economicalRepository = {
  // Lấy danh sách mục tiêu
  async fetchGoals(userId) {
    const { data, error } = await supabase
      .from("economical")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Thêm mục tiêu mới
  async addGoal(goalData) {
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
    const { error } = await supabase
      .from("economical")
      .delete()
      .eq("id", goalId);

    if (error) throw error;
    return true;
  },

  // Nạp tiền vào mục tiêu (Cập nhật số tiền hiện tại)
  async depositToGoal(goalId, newAmount, newStatus) {
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
