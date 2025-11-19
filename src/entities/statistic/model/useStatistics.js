import { useQuery } from "@tanstack/react-query";
import { statisticRepository } from "../api/statisticRepository";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

export const useStatistics = (userId, filters) => {
  // 1. Pie Chart
  const pieQuery = useQuery({
    queryKey: QUERY_KEYS.STATISTIC.PIE(userId, filters.pie),
    queryFn: async () => {
      const data = await statisticRepository.getExpensesByCategory(
        userId,
        filters.pie.from,
        filters.pie.to
      );
      const labels = data.map((item) => item.category);
      const values = data.map((item) => item.total_amount);
      return {
        labels,
        datasets: [
          {
            label: "Tổng chi tiêu",
            data: values,
            backgroundColor: [
              "#ff6384",
              "#36a2eb",
              "#ffce56",
              "#4bc0c0",
              "#9966ff",
              "#ff9f40",
              "#8bc34a",
              "#e91e63",
              "#607d8b",
            ],
          },
        ],
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Bar & Line Chart
  const monthlyQuery = useQuery({
    queryKey: QUERY_KEYS.STATISTIC.BAR(userId, filters.bar),
    queryFn: async () => {
      const data = await statisticRepository.getMonthlyStats(
        userId,
        filters.bar.from,
        filters.bar.to
      );
      const months = data.map((item) => item.month.substring(0, 7));

      const barData = {
        labels: months,
        datasets: [
          {
            label: "Thu nhập",
            backgroundColor: "#77dd77",
            data: data.map((i) => i.total_income),
          },
          {
            label: "Chi tiêu",
            backgroundColor: "#ef5350",
            data: data.map((i) => i.total_expense),
          },
        ],
      };

      let accumulatedBalance = 0;
      const balanceData = data.map((item) => {
        accumulatedBalance += item.net_balance;
        return accumulatedBalance;
      });

      const lineData = {
        labels: months,
        datasets: [
          {
            label: "Số dư ví (Tích lũy)",
            data: balanceData,
            borderColor: "#388e3c",
            backgroundColor: "#388e3c",
            fill: false,
          },
        ],
      };

      return { barData, lineData };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    pieData: pieQuery.data,
    barData: monthlyQuery.data?.barData,
    lineData: monthlyQuery.data?.lineData,
    isLoading: pieQuery.isLoading || monthlyQuery.isLoading,
  };
};
