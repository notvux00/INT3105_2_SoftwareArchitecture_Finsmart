/**
 * Budget entity API layer
 * Handles all budget/limit-related database operations
 */
import { supabase } from '../../../shared';
import { API_ENDPOINTS } from '../../../shared/config';
import {retryWrapper} from "../../retryWrapper"
import {rateLimitCheck} from "../../rateLimitAndRetry"


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

export const budgetRepository = {
  async fetchBudgets(userId) {
    console.log("vao dc")
    await rateLimitCheck(userId);
    const apiCall = async () => {
      const { data, error } = await supabase
        .from(API_ENDPOINTS.LIMITS)
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data || [];
    };

    return retryWrapper(apiCall); 
  },

  async addBudget(budgetData) {
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
