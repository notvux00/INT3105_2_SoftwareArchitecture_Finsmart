import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { periodicRepository } from "../api/periodicRepository";
import { userRepository } from "../../user/api/userRepository"; // Để lấy wallet_id
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

export const usePeriodic = (userId) => {
  const queryClient = useQueryClient();
  const periodicKey = QUERY_KEYS.PERIODIC(userId);

  // 1. Query: Lấy danh sách
  const { data: periodicList = [], isLoading } = useQuery({
    queryKey: periodicKey,
    queryFn: () => periodicRepository.fetchPeriodic(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: periodicKey });

  // 2. Mutation: Thêm
  const addPeriodicMutation = useMutation({
    mutationFn: async (newData) => {
      // Cần lấy wallet_id trước
      const walletInfo = await userRepository.getWalletId(userId);
      return periodicRepository.addPeriodic({
        ...newData,
        user_id: userId,
        wallet_id: walletInfo.wallet_id,
      });
    },
    onSuccess: invalidate,
  });

  // 3. Mutation: Sửa
  const updatePeriodicMutation = useMutation({
    mutationFn: ({ id, updates }) =>
      periodicRepository.updatePeriodic(id, updates),
    onSuccess: invalidate,
  });

  // 4. Mutation: Xóa
  const deletePeriodicMutation = useMutation({
    mutationFn: (id) => periodicRepository.deletePeriodic(id),
    onSuccess: invalidate,
  });

  return {
    periodicList,
    isLoading,
    addPeriodic: addPeriodicMutation.mutateAsync,
    updatePeriodic: updatePeriodicMutation.mutateAsync,
    deletePeriodic: deletePeriodicMutation.mutateAsync,

    isAdding: addPeriodicMutation.isPending,
    isUpdating: updatePeriodicMutation.isPending,
    isDeleting: deletePeriodicMutation.isPending,
  };
};
