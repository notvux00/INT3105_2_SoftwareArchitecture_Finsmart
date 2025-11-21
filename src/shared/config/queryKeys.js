// src/shared/config/queryKeys.js

export const QUERY_KEYS = {
  // Key cho thông tin User (số dư ví, tên...)
  USER: (userId) => ["user", userId],

  // Key cho dữ liệu Giao dịch (Lịch sử, Biểu đồ)
  TRANSACTIONS: (userId) => ["transactions", userId],

  // Key cho Hạn mức chi tiêu
  LIMITS: (userId) => ["limits", userId],

  STATISTIC: {
    PIE: (userId, filter) => ["statistic", "pie", userId, filter],
    BAR: (userId, filter) => ["statistic", "bar", userId, filter],
    LINE: (userId, filter) => ["statistic", "line", userId, filter],
  },

  GOALS: (userId) => ["goals", userId],

  PERIODIC: (userId) => ["periodic", userId],

  SYSTEM: {
    HEALTH: ["system", "health"],
  },
};
