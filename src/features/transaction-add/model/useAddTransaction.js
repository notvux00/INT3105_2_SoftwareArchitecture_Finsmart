/**
 * Transaction-add feature model layer
 * Refactored to use React Query Mutation
 */
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTransactionAPI } from "../api/addTransaction";
import { userRepository } from "../../../entities/user";
import { TRANSACTION_TYPES } from "../../../shared/config";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

export const useAddTransaction = (userId) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Lấy danh sách Hạn mức (Limits) bằng useQuery
  // Thay thế useEffect thủ công
  const { data: limits = [] } = useQuery({
    queryKey: QUERY_KEYS.LIMITS(userId),
    queryFn: () => addTransactionAPI.fetchLimits(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  // 2. Mutation: Xử lý logic Thêm giao dịch
  const mutation = useMutation({
    mutationFn: async (transactionData) => {
      if (!userId) throw new Error("Không xác thực được người dùng.");

      const amountNumber = parseFloat(transactionData.amount);

      // Validate dữ liệu
      if (
        !transactionData.amount ||
        !transactionData.category ||
        !transactionData.date
      ) {
        throw new Error(
          "Vui lòng nhập đầy đủ số tiền, chọn hạng mục và ngày giao dịch."
        );
      }
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error("Số tiền không hợp lệ. Vui lòng nhập số lớn hơn 0.");
      }
      const selectedDate = new Date(transactionData.date);
      const currentDate = new Date();
      if (selectedDate > currentDate) {
        throw new Error("Ngày giao dịch không hợp lệ. Vui lòng chọn lại ngày.");
      }

      // Lấy thông tin ví
      const walletInfo = await userRepository.getWalletId(userId);
      const walletId = walletInfo.wallet_id;
      const currentBalance = walletInfo.balance;

      const finalTransactionData = {
        user_id: userId,
        wallet_id: walletId,
        category: transactionData.category,
        amount: amountNumber,
        created_at: new Date(transactionData.date).toISOString(),
        note: transactionData.note || null,
      };

      let newBalance;
      const transactionType = transactionData.type;

      if (transactionType === TRANSACTION_TYPES.INCOME) {
        newBalance = currentBalance + amountNumber;
      } else {
        newBalance = currentBalance - amountNumber;

        // Kiểm tra số dư
        if (newBalance < 0) {
          throw new Error("Số dư không đủ để thực hiện giao dịch này.");
        }

        // Xử lý Hạn mức (Limit)
        if (transactionData.limitId) {
          const selectedLimit = limits.find(
            (limit) => limit.limit_id === transactionData.limitId
          );

          if (selectedLimit) {
            const newUsedAmount = (selectedLimit.used || 0) + amountNumber;

            if (newUsedAmount > selectedLimit.limit_amount) {
              throw new Error(
                `Hạn mức "${selectedLimit.limit_name}" đã vượt quá giới hạn. Vui lòng chọn hạn mức khác.`
              );
            }

            // Cập nhật hạn mức
            await addTransactionAPI.updateLimitUsage(
              selectedLimit.limit_id,
              newUsedAmount
            );
            finalTransactionData.limit_id = transactionData.limitId;
          }
        }
      }

      // Gọi API thêm giao dịch
      await addTransactionAPI.addTransaction(
        finalTransactionData,
        transactionType
      );

      // Cập nhật số dư ví
      await userRepository.updateWalletBalance(walletId, newBalance);

      return true; // Trả về true nếu thành công
    },

    // CẬP NHẬT TỰ ĐỘNG
    onSuccess: () => {
      // 1. Báo cho hệ thống biết danh sách giao dịch đã thay đổi -> Home tự tải lại
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TRANSACTIONS(userId),
      });

      // 2. Báo số dư ví đã thay đổi -> Home tự cập nhật số tiền
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(userId) });

      // 3. Báo hạn mức đã thay đổi (nếu có dùng)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIMITS(userId) });

      alert("Thêm giao dịch thành công.");
      navigate("/home");
    },
    onError: (error) => {
      console.error("Lỗi thêm giao dịch:", error);
      alert(`Đã xảy ra lỗi: ${error.message}`);
    },
  });

  return {
    limits,
    addTransaction: mutation.mutate, // UI sẽ gọi hàm này
    loading: mutation.isPending, // Trạng thái đang xử lý
    refetchLimits: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIMITS(userId) }),
  };
};
