import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTransactionAPI } from "../api/addTransaction";
import { userRepository } from "../../../entities/user"; // Vẫn dùng để lấy walletId
import { TRANSACTION_TYPES } from "../../../shared/config";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

// Thêm URL Function (lấy từ biến môi trường hoặc hardcode để test local)
const SUPABASE_PROJECT_URL = 'https://nvbdupcoynrzkrwyhrjc.supabase.co'; // URL dự án của bạn
const SAGA_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/create-transaction-saga`;

export const useAddTransaction = (userId) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Lấy danh sách Hạn mức (Giữ nguyên)
  const { data: limits = [] } = useQuery({
    queryKey: QUERY_KEYS.LIMITS(userId),
    queryFn: () => addTransactionAPI.fetchLimits(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Mutation: SỬA ĐỔI ĐỂ GỌI EDGE FUNCTION
  const mutation = useMutation({
    mutationFn: async (transactionData) => {
      if (!userId) throw new Error("Không xác thực được người dùng.");

      // Lấy wallet_id (Client chỉ cần gửi ID, logic trừ tiền Server lo)
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

      // Lấy token xác thực để gửi kèm (vì function verify_jwt = true)
      const session = JSON.parse(localStorage.getItem('sb-nvbdupcoynrzkrwyhrjc-auth-token') || '{}'); 
      // Lưu ý: Bạn cần đảm bảo lấy đúng access_token từ session Supabase hiện tại.
      // Nếu bạn đang dùng cơ chế auth cũ trong code (chỉ lưu encrypted user_id), 
      // bạn có thể cần truyền REACT_APP_SUPABASE_ANON_KEY vào header Authorization
      // hoặc sửa Edge Function verify_jwt = false nếu chưa tích hợp Auth đầy đủ.
      
      // Với code hiện tại của bạn dùng encryptedUserId, ta dùng ANON KEY tạm thời:
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
      // Invalidate tất cả để làm mới dữ liệu
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