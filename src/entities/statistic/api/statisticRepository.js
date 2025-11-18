import { supabase } from '../../../shared';

export const statisticRepository = {
  // Lấy dữ liệu chi tiêu theo danh mục từ SQL View
  async getExpensesByCategory(userId, fromDate, toDate) {
    let query = supabase
      .from('view_expenses_by_category') // Gọi vào View thay vì Table
      .select('*')
      .eq('user_id', userId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Lấy dữ liệu thu chi theo tháng từ SQL View
  async getMonthlyStats(userId, fromDate, toDate) {
    let query = supabase
      .from('view_monthly_stats')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: true });

    if (fromDate) {
      query = query.gte('month', fromDate.toISOString());
    }
    if (toDate) {
      query = query.lte('month', toDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};