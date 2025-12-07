import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../shared";
import { QUERY_KEYS } from "../../../shared/config/queryKeys";

export const useTransactionRealtime = (userId) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log("🔌 Initializing Realtime Subscription for User:", userId);

    const channel = supabase
      .channel("realtime-transactions")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("⚡ Realtime Update (Transactions):", payload);
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS(userId) });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(userId) });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "income",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("⚡ Realtime Update (Income):", payload);
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS(userId) });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(userId) });
        }
      )
       .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("⚡ Realtime Update (Wallets):", payload);
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(userId) });
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime Status:", status);
      });

    return () => {
      console.log("🔌 Disconnecting Realtime...");
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
