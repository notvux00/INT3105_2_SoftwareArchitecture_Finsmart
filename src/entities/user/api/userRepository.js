/**
 * User entity API layer
 * Handles all user-related database operations
 */
import { supabase } from '../../../shared';
import {retryWrapper} from "../../retryWrapper"


export const userRepository = {
  // Fetch user information by ID
  async fetchUser(userId) {
    console.log("dawdwadwa")
      const apiCall = async () => {
        console.log("heree")
        const { data, error } = await supabase
          .from("users")
          .select("full_name")
          .eq("user_id", userId)
          .single();

        if (error) {
          throw error;
        }

        return data;
      };
      return retryWrapper(apiCall);
    },

  // Fetch user's wallet information
  async fetchWallet(userId) {
    console.log("12333")
    const apiCall = async () => {
      console.log("12333")
      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    };
    return retryWrapper(apiCall);
  },

  // Update user's wallet balance
  async updateWalletBalance(walletId, newBalance) {
    const { error } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("wallet_id", walletId);

    if (error) {
      console.error("Error updating wallet balance:", error);
      throw error;
    }
},

  // Get user's wallet ID
  async getWalletId(userId) {
    const apiCall = async () => {
      console.log("getWalletId")
    const { data, error } = await supabase
      .from("wallets")
      .select("wallet_id, balance")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error("Error fetching wallet ID:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Không tìm thấy ví của bạn. Vui lòng tạo ví trước.");
    }
    return data[0];
  };
  return retryWrapper(apiCall); 
}
}
