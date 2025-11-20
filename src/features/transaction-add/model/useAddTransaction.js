import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTransactionAPI } from "../api/addTransaction";
import { userRepository } from "../../../entities/user";
import { TRANSACTION_TYPES } from "../../../shared/config";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

const SUPABASE_PROJECT_URL = 'https://nvbdupcoynrzkrwyhrjc.supabase.co';
const SAGA_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/create-transaction-saga`;

export const useAddTransaction = (userId) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Lấy danh sách Hạn mức
  const { data: limits = [] } = useQuery({
    queryKey: QUERY_KEYS.LIMITS(userId),
    queryFn: () => addTransactionAPI.fetchLimits(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: SỬA ĐỔI ĐỂ GỌI EDGE FUNCTION
  const mutation = useMutation({
    mutationFn: async (transactionData) => {
      if (!userId) throw new Error("Không xác thực được người dùng.");

      // Lấy wallet_id
      const walletInfo = await userRepository.getWalletId(userId);
      const walletId = walletInfo.wallet_id;

      // Chuẩn bị payload gửi lên Edge Function
      const payload = {
        user_id: userId,
        wallet_id: walletId,
        category: transactionData.category,
        amount: parseFloat(transactionData.amount),
        date: new Date(transactionData.date).toISOString(),
        note: transactionData.note || null,
        type: transactionData.type, // 'thu' hoặc 'chi'
        limit_id: transactionData.limitId || null
      };

      const session = JSON.parse(localStorage.getItem('sb-nvbdupcoynrzkrwyhrjc-auth-token') || '{}'); 
      
      const token = process.env.REACT_APP_SUPABASE_ANON_KEY; 

      const response = await fetch(SAGA_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Lỗi khi xử lý giao dịch.");
      }

      return true;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIMITS(userId) });

      alert("Thêm giao dịch thành công (Secured by Saga).");
    },
    onError: (error) => {
      console.error("Lỗi thêm giao dịch:", error);
      alert(`Thất bại: ${error.message}`);
    },
  });

  return {
    limits,
    addTransaction: mutation.mutate,
    loading: mutation.isPending,
    refetchLimits: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIMITS(userId) }),
  };
};