/**
 * Transaction entity model layer
 * Uses React Query for Caching & State Management
 */
import { useQuery } from "@tanstack/react-query";
import { transactionRepository } from "../api/transactionRepository";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

export const useTransactions = (userId) => {
  // useQuery tự động quản lý loading, error và data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.TRANSACTIONS(userId), // Key: ['transactions', userId]
    queryFn: async () => {
      // Gọi song song 3 API như cũ để tối ưu thời gian
      const [history, chartDataResult, chartDefault] = await Promise.all([
        transactionRepository.fetchHistory(userId),
        transactionRepository.fetchChartData(userId),
        transactionRepository.fetchChartDataDefault(userId),
      ]);

      // Trả về một object gom tất cả dữ liệu
      return {
        history,
        chartData: chartDataResult.chartData,
        totalIncome: chartDataResult.totalIncome,
        totalExpense: chartDataResult.totalExpense,
        chartDataDefault: chartDefault.chartData,
        totalIncomeDefault: chartDefault.totalIncome,
        totalExpenseDefault: chartDefault.totalExpense,
      };
    },
    enabled: !!userId, // Chỉ chạy khi có userId
    staleTime: 5 * 60 * 1000, // Dữ liệu được coi là mới trong 5 phút
    refetchOnWindowFocus: true, // Tự cập nhật khi user quay lại tab
  });

  return {
    // Nếu data chưa có (lần đầu load), trả về giá trị mặc định an toàn
    history: data?.history || [],
    chartData: data?.chartData || [],
    totalIncome: data?.totalIncome || 0,
    totalExpense: data?.totalExpense || 0,

    chartDataDefault: data?.chartDataDefault || [],
    totalIncomeDefault: data?.totalIncomeDefault || 0,
    totalExpenseDefault: data?.totalExpenseDefault || 0,

    loading: isLoading,
    error,
    refetch,
  };
};

export const useTransactionHistory = (userId, filters) => {
  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useQuery({
    // Key cache thay đổi theo filter. Ví dụ: ['transactions', 'full', 123, {startDate: '...'}]
    // Khi filter đổi, React Query tự động gọi lại API mới.
    queryKey: ["transactions", "full", userId, filters],

    queryFn: () => transactionRepository.fetchAllTransactions(userId, filters),

    enabled: !!userId,
    staleTime: 0, // Với trang lịch sử filter, ta nên để 0 để luôn đảm bảo chính xác khi đổi ngày
    keepPreviousData: true, // Giữ data cũ hiển thị trong lúc đang load data mới (tránh giật)
  });

  return { transactions, isLoading, refetch };
};
