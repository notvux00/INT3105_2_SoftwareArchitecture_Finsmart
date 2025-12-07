/**
 * User entity model layer
 * Uses React Query for Caching User Data
 */
import { useQuery } from "@tanstack/react-query";
import { userRepository } from "../api/userRepository";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

export const useUser = (userId) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.USER(userId), // Key: ['user', userId]
    queryFn: async () => {
      const [userData, walletData] = await Promise.all([
        userRepository.fetchUser(userId),
        userRepository.fetchWallet(userId),
      ]);

      return {
        username: userData?.full_name || "",
        balance: walletData?.balance || 0,
      };
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Cache 30 giây (Đồng bộ với useTransactions)
  });

  return {
    username: data?.username || "",
    balance: data?.balance || 0,
    loading: isLoading,
    refetch,
  };
};
