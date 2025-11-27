import { supabase } from "../../../shared";
import {retryWrapper} from "../../retryWrapper"

// Hàm helper tính ngày thực hiện tiếp theo (Lấy từ code cũ)
const calculateNextExecution = (startDate, frequency) => {
  let date = new Date(startDate);
  if (isNaN(date.getTime())) date = new Date();

  switch (frequency) {
    case "3 phút":
      date.setMinutes(date.getMinutes() + 3);
      break;
    case "Hàng ngày":
      date.setDate(date.getDate() + 1);
      break;
    case "Hàng tuần":
      date.setDate(date.getDate() + 7);
      break;
    case "Hàng tháng":
      date.setMonth(date.getMonth() + 1);
      break;
    case "Hàng quý":
      date.setMonth(date.getMonth() + 3);
      break;
    case "Hàng năm":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      break;
  }
  return date.toISOString();
};

export const periodicRepository = {
  // Lấy danh sách (READ)
  async fetchPeriodic(userId) {
    const apiCall = async () => {
      const { data, error } = await supabase
        .from("preodic")
        .select(
          "id, name_preodic, amount, frequency, startDate, endDate, is_active, next_execution"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        name: item.name_preodic,
        status: item.is_active ? "Hoạt động" : "Tạm dừng",
      }));
    };
    return retryWrapper(apiCall);
  },

  // Thêm mới
  async addPeriodic(periodicData) {
      console.log("retry ok")
      const nextExecution = calculateNextExecution(
        periodicData.frequency === "3 phút" ? new Date() : periodicData.startDate,
        periodicData.frequency
      );

      const { data, error } = await supabase
        .from("preodic")
        .insert([
          {
            user_id: periodicData.user_id,
            wallet_id: periodicData.wallet_id,
            name_preodic: periodicData.name,
            amount: periodicData.amount,
            frequency: periodicData.frequency,
            startDate: new Date(periodicData.startDate).toISOString(),
            endDate: new Date(periodicData.endDate).toISOString(),
            is_active: periodicData.is_active,
            next_execution: nextExecution,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
  },

  // Cập nhật
async updatePeriodic(id, updates) {
  console.log("retry ok")
      const { data, error } = await supabase
        .from("preodic")
        .update({
          name_preodic: updates.name,
          amount: updates.amount,
          frequency: updates.frequency,
          startDate: new Date(updates.startDate).toISOString(),
          endDate: new Date(updates.endDate).toISOString(),
          is_active: updates.status === "Hoạt động",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
  },

  // Xóa
  async deletePeriodic(id) {
    console.log("retry ok")
    const apiCall = async () => {
      const { error } = await supabase.from("preodic").delete().eq("id", id);
      if (error) throw error;
      return true;
    };
    
    return retryWrapper(apiCall);
  },
};
