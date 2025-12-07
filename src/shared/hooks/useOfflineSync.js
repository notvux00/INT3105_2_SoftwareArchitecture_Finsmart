import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { offlineQueue } from '../lib/offlineQueue';
import { networkStatus } from '../lib/networkStatus';

const SUPABASE_PROJECT_URL = process.env.REACT_APP_SUPABASE_URL;
const SAGA_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/create-transaction-saga`;

export const useOfflineSync = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOnline = async () => {
            console.log("📡 Network Restored! Checking Offline Queue...");
            
            // Add slight delay to avoid rapid fire updates on mount
            await new Promise(r => setTimeout(r, 1000));

            const queue = offlineQueue.getAll();
            if (queue.length === 0) return;

            toast.info(`📡 Có mạng! Đang đồng bộ ${queue.length} giao dịch...`, { autoClose: 2000 });

            let successCount = 0;
            const token = process.env.REACT_APP_SUPABASE_ANON_KEY;

            for (const item of queue) {
                try {
                    // Remove internal fields
                    const { temp_id, status, ...payload } = item;

                    const res = await fetch(SAGA_FUNCTION_URL, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        successCount++;
                    } else {
                        console.error("Sync failed for item:", item);
                    }
                } catch (e) {
                    console.error("Sync error:", e);
                }
            }

            if (successCount > 0) {
                // Clear queue
                offlineQueue.clear();
                
                // Invalidate all to refresh UI
                queryClient.invalidateQueries();
                
                toast.success(`✅ Đã đồng bộ ${successCount} giao dịch offline!`, {
                    position: "top-center",
                    autoClose: 4000
                });
            }
        };

        // Listen for Online event
        networkStatus.addOnOnlineListener(handleOnline);

        // Check immediately on mount (in case we started online but have items)
        // Wrapped in timeout to prevent immediate state update loops on render
        const initCheck = setTimeout(() => {
            if (networkStatus.isOnline() && offlineQueue.size() > 0) {
                handleOnline();
            }
        }, 2000);

        return () => {
            networkStatus.removeListeners(handleOnline);
            clearTimeout(initCheck);
        };
    }, [queryClient]);
};
