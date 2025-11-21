/**
 * Transaction entity API layer
 * Handles all transaction-related database operations
 */
import { supabase } from "../../../shared";

export const transactionRepository = {
  // Fetch transaction history for a user
  async fetchHistory(userId) {
    const [incomeRes, transactionRes] = await Promise.all([
      supabase
        .from("income")
        .select("category, amount, created_at")
        .eq("user_id", userId),
      supabase
        .from("transactions")
        .select("category, amount, created_at")
        .eq("user_id", userId),
    ]);

    if (incomeRes.error || transactionRes.error) {
      console.error(
        "Error fetching history:",
        incomeRes.error || transactionRes.error
      );
      return [];
    }

    const incomes = incomeRes.data.map((item) => ({
      ...item,
      type: "income",
    }));

    const transactions = transactionRes.data.map((item) => ({
      ...item,
      type: "transaction",
    }));

    const all = [...incomes, ...transactions].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return all.slice(0, 15);
  },

  // Fetch chart data for a user
  async fetchChartData(userId) {
    const { data: incomeDataRaw, error: incomeError } = await supabase
      .from("income")
      .select("amount, created_at")
      .eq("user_id", userId);

    if (incomeError) throw incomeError;

    const { data: transactionDataRaw, error: transactionError } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("user_id", userId);

    if (transactionError) throw transactionError;

    const incomeTotal = incomeDataRaw.reduce((sum, i) => sum + i.amount, 0);
    const expenseTotal = transactionDataRaw.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const dateMap = {};

    incomeDataRaw.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("vi-VN");
      if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
      dateMap[date].income += item.amount;
    });

    transactionDataRaw.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("vi-VN");
      if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
      dateMap[date].expense += item.amount;
    });

    const chartArray = Object.values(dateMap).sort(
      (a, b) =>
        new Date(a.date.split("/").reverse().join("-")) -
        new Date(b.date.split("/").reverse().join("-"))
    );

    return {
      chartData: chartArray,
      totalIncome: incomeTotal,
      totalExpense: expenseTotal,
    };
  },

  // Fetch chart data for the last month
  async fetchChartDataDefault(userId) {
    const { data: incomeDataRaw, error: incomeError } = await supabase
      .from("income")
      .select("amount, created_at")
      .eq("user_id", userId);

    if (incomeError) throw incomeError;

    const { data: transactionDataRaw, error: transactionError } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("user_id", userId);

    if (transactionError) throw transactionError;

    // Only get data from the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const incomeData = incomeDataRaw.filter(
      (item) => new Date(item.created_at) >= oneMonthAgo
    );

    const transactionData = transactionDataRaw.filter(
      (item) => new Date(item.created_at) >= oneMonthAgo
    );

    const incomeTotal = incomeData.reduce((sum, i) => sum + i.amount, 0);
    const expenseTotal = transactionData.reduce((sum, t) => sum + t.amount, 0);

    const dateMap = {};

    incomeData.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("vi-VN");
      if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
      dateMap[date].income += item.amount;
    });

    transactionData.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("vi-VN");
      if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
      dateMap[date].expense += item.amount;
    });

    const chartArray = Object.values(dateMap).sort(
      (a, b) =>
        new Date(a.date.split("/").reverse().join("-")) -
        new Date(b.date.split("/").reverse().join("-"))
    );

    return {
      chartData: chartArray,
      totalIncome: incomeTotal,
      totalExpense: expenseTotal,
    };
  },

  async fetchAllTransactions(userId, { startDate, endDate } = {}) {
    // 1. Query Income
    let incomeQuery = supabase
      .from("income")
      .select("category, amount, created_at, note") // Lấy thêm field 'note'
      .eq("user_id", userId);

    if (startDate) incomeQuery = incomeQuery.gte("created_at", startDate);
    if (endDate) incomeQuery = incomeQuery.lte("created_at", endDate);

    // 2. Query Expense
    let expenseQuery = supabase
      .from("transactions")
      .select("category, amount, created_at, note")
      .eq("user_id", userId);

    if (startDate) expenseQuery = expenseQuery.gte("created_at", startDate);
    if (endDate) expenseQuery = expenseQuery.lte("created_at", endDate);

    // Chạy song song
    const [incomeRes, expenseRes] = await Promise.all([
      incomeQuery,
      expenseQuery,
    ]);

    if (incomeRes.error || expenseRes.error) {
      console.error(
        "Error fetching history full:",
        incomeRes.error || expenseRes.error
      );
      throw new Error("Lỗi tải dữ liệu lịch sử");
    }

    const incomes = incomeRes.data.map((item) => ({ ...item, type: "income" }));
    const expenses = expenseRes.data.map((item) => ({
      ...item,
      type: "expense",
    }));

    // Gộp và sắp xếp giảm dần (mới nhất lên đầu)
    return [...incomes, ...expenses].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  },
};
