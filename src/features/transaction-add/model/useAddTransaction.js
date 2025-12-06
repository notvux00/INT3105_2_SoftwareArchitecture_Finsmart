import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTransactionAPI } from "../api/addTransaction";
import { userRepository } from "../../../entities/user";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";
import { toast } from "react-toastify";

const SUPABASE_PROJECT_URL = process.env.REACT_APP_SUPABASE_URL;
const SAGA_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/create-transaction-saga`;

// Helper function: Fetch with timeout
const fetchWithTimeout = async (url, options, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw error;
  }
};

export const useAddTransaction = (userId) => {
  const queryClient = useQueryClient();

  // Lấy danh sách Hạn mức
  const { data: limits = [] } = useQuery({
    queryKey: QUERY_KEYS.LIMITS(userId),
    queryFn: () => addTransactionAPI.fetchLimits(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: GỌI EDGE FUNCTION với TIMEOUT + RETRY
  const mutation = useMutation({
    mutationFn: async (transactionData) => {
      if (!userId) throw new Error("Không xác thực được người dùng.");

      // Lấy wallet_id
      const walletInfo = await userRepository.getWalletId(userId);
      const walletId = walletInfo.wallet_id;

      // ⭐ TẠO IDEMPOTENCY KEY TRƯỚC (để dùng cho retry)
      const idempotencyKey = crypto.randomUUID();

      // Chuẩn bị payload gửi lên Edge Function
      const payload = {
        user_id: userId,
        wallet_id: walletId,
        category: transactionData.category,
        amount: parseFloat(transactionData.amount),
        date: new Date(transactionData.date).toISOString(),
        note: transactionData.note || null,
        type: transactionData.type, // 'thu' hoặc 'chi'
        limit_id: transactionData.limitId || null,
        idempotency_key: idempotencyKey,
      };

      const token = process.env.REACT_APP_SUPABASE_ANON_KEY;

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      };

      try {
        // LẦN 1: Gửi request với timeout 5 giây
        const response = await fetchWithTimeout(
          SAGA_FUNCTION_URL,
          requestOptions,
          5000
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Lỗi khi xử lý giao dịch.");
        }

        return result;

      } catch (error) {
        // XỬ LÝ TIMEOUT → TỰ ĐỘNG RETRY
        if (error.message === 'TIMEOUT') {
          console.warn('⏱️ Request timeout, retrying with same idempotency_key...');
          toast.warning("⏱️ Mạng chậm, đang thử lại...", {
            autoClose: 2000,
            position: "top-center"
          });

          // Đợi 1 giây rồi retry
          await new Promise(resolve => setTimeout(resolve, 1000));

          // LẦN 2: RETRY với CÙNG idempotency_key, timeout dài hơn
          const retryResponse = await fetchWithTimeout(
            SAGA_FUNCTION_URL,
            requestOptions,
            10000
          );

          const retryResult = await retryResponse.json();

          if (!retryResponse.ok) {
            throw new Error(retryResult.error || "Lỗi khi xử lý giao dịch.");
          }

          return retryResult;
        }

        // Lỗi khác (network, API error)
        throw error;
      }
    },

    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIMITS(userId) });

      toast.success("✅ Giao dịch thành công!", {
        position: "top-center",
        autoClose: 3000,
      });
    },

    onError: (error) => {
      console.error("Lỗi thêm giao dịch:", error);
      
      let errorMessage = "Thêm giao dịch thất bại.";
      
      if (error.message.includes("Số dư")) {
        errorMessage = "❌ " + error.message;
      } else if (error.message.includes("TIMEOUT")) {
        errorMessage = "⏱️ Kết nối quá chậm, vui lòng thử lại sau.";
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }

      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
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