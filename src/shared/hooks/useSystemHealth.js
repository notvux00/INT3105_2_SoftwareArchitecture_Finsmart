// src/shared/hooks/useSystemHealth.js
import { useQuery } from "@tanstack/react-query";
import { systemAPI } from "../api/systemAPI";
import { QUERY_KEYS } from "../config/queryKeys";

export const useSystemHealth = () => {
  const { isSuccess, isError, isLoading } = useQuery({
    queryKey: QUERY_KEYS.SYSTEM.HEALTH,
    queryFn: systemAPI.checkHealth,
    refetchInterval: 30000, // Tự động ping lại mỗi 30 giây
    retry: false, // Không retry, lỗi là báo đỏ ngay
    refetchOnWindowFocus: true,
  });

  // Status: 'loading' | 'online' | 'offline'
  let status = "online";
  if (isLoading) status = "loading";
  if (isError) status = "offline";
  if (isSuccess) status = "online";

  return status;
};
