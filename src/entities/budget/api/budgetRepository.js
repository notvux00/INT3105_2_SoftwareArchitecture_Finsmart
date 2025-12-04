/**
 * Budget entity API layer
 * Handles all budget/limit-related database operations
 */
import { supabase } from '../../../shared';
import { API_ENDPOINTS } from '../../../shared/config';
import {retryWrapper} from "../../retryWrapper"
import {rateLimitCheck} from "../../rateLimiting"

export const budgetRepository = {
  async fetchBudgets(userId) {
    console.log("vao dc")
    const x = await rateLimitCheck(26);
    const apiCall = async () => {
      const { data, error } = await supabase
        .from(API_ENDPOINTS.LIMITS)
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      else console.log("goi thanh cong toi supabase");
      return data || [];
    };

    return retryWrapper(apiCall); 
  },

  async addBudget(budgetData) {
    const x = await rateLimitCheck(26);
    console.log("them dc")
      const { data, error } = await supabase
        .from(API_ENDPOINTS.LIMITS)
        .insert([budgetData])
        .select("*");

      if (error) throw error;
      return data[0];
  },

  // Update budget
async updateBudget(limitId, updateData) {
  console.log("update dc")
  const x = await rateLimitCheck(26);
      const { data, error } = await supabase
        .from(API_ENDPOINTS.LIMITS)
        .update(updateData)
        .eq("limit_id", limitId)
        .select();

      if (error) throw error;
      return data[0];
  },

  // Delete budget
  async deleteBudget(limitId) {
    const apiCall = async () => {
      console.log("ok xoa r")
          const { error } = await supabase
            .from(API_ENDPOINTS.LIMITS)
            .delete()
            .eq("limit_id", limitId);

          if (error) throw error;
        };
        
        return retryWrapper(apiCall);
  },

  async resetBudgetUsage(limitId) {
    const x = await rateLimitCheck(26);
    const apiCall = async () => {
      const now = new Date();
      const { data, error } = await supabase
        .from(API_ENDPOINTS.LIMITS)
        .update({
          used: 0,
          start_date: now.toISOString(),
        })
        .eq("limit_id", limitId)
        .select();

      if (error) throw error;
      return data[0];
    };
    
    return retryWrapper(apiCall);
  },
};
