import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { economicalRepository } from "../api/economicalRepository";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

export const useEconomical = (userId) => {
  const queryClient = useQueryClient();
  const goalsKey = QUERY_KEYS.GOALS(userId);

  // 1. Query: Lấy danh sách mục tiêu
  const { data: goals = [], isLoading } = useQuery({
    queryKey: goalsKey,
    queryFn: () => economicalRepository.fetchGoals(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  // Helper function để làm mới cache sau khi mutate
  const invalidateGoals = () =>
    queryClient.invalidateQueries({ queryKey: goalsKey });

  // 2. Mutation: Thêm mục tiêu
  const addGoalMutation = useMutation({
    mutationFn: (newGoal) =>
      economicalRepository.addGoal({ ...newGoal, user_id: userId }),
    onSuccess: invalidateGoals,
  });

  // 3. Mutation: Sửa mục tiêu
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, updates }) =>
      economicalRepository.updateGoal(id, updates),
    onSuccess: invalidateGoals,
  });

  // 4. Mutation: Xóa mục tiêu
  const deleteGoalMutation = useMutation({
    mutationFn: (id) => economicalRepository.deleteGoal(id),
    onSuccess: invalidateGoals,
  });

  // 5. Mutation: Nạp tiền
  const depositMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      currentAmount,
      targetAmount,
      currentStatus,
    }) => {
      const newAmount = currentAmount + amount;
      // Tự động cập nhật trạng thái nếu đủ tiền
      const newStatus = newAmount >= targetAmount ? "completed" : currentStatus;
      return economicalRepository.depositToGoal(id, newAmount, newStatus);
    },
    onSuccess: invalidateGoals,
  });

  return {
    goals,
    isLoading,
    addGoal: addGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    depositToGoal: depositMutation.mutateAsync,

    // Trạng thái loading của các hành động (để disable nút bấm khi đang xử lý)
    isAdding: addGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending || depositMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
  };
};
