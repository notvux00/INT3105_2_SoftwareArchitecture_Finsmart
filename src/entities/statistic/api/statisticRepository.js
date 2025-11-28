import { supabase } from '../../../shared';
import {retryWrapper} from "../../retryWrapper"
import {rateLimitCheck} from "../../rateLimiting"


export const statisticRepository = {
  // Lấy dữ liệu chi tiêu theo danh mục từ SQL View
  async getExpensesByCategory(userId, fromDate, toDate) {
     const x = await rateLimitCheck(userId);
    const apiCall = async () => {
      console.log("ok retry")
      let query = supabase
        .from('view_expenses_by_category') 
        .select('*')
        .eq('user_id', userId);
            
      const { data, error } = await query;
      if (error) throw error;
      return data;
    };
    
    return retryWrapper(apiCall);
  },

  // Lấy dữ liệu thu chi theo tháng từ SQL View
  async getMonthlyStats(userId, fromDate, toDate) {
     const x = await rateLimitCheck(userId);
    const apiCall = async () => {
      console.log("ok day")
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
    };
    return retryWrapper(apiCall);
  }
};