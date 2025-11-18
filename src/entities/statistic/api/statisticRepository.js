import { supabase } from '../../../shared'; // Import từ shared layer

export const statisticRepository = {
  // Lấy dữ liệu chi tiêu theo danh mục từ SQL View
  async getExpensesByCategory(userId, fromDate, toDate) {
    let query = supabase
      .from('view_expenses_by_category') // Gọi vào View thay vì Table
      .select('*')
      .eq('user_id', userId);

    // Lưu ý: View group sẵn toàn bộ thời gian, nếu cần lọc ngày cụ thể 
    // thì View cần sửa để không group cứng hoặc lọc ở bước WHERE của View.
    // Tuy nhiên, để tối ưu đơn giản theo Nhiệm vụ 5, ta lấy dữ liệu tổng quan trước.
    
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