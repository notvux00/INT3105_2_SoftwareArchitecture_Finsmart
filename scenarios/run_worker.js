
const fetch = require('node-fetch');
require('dotenv').config();

const API_URL = "https://nvbdupcoynrzkrwyhrjc.supabase.co";
const WORKER_ENDPOINT = `${API_URL}/functions/v1/process-queue-worker`;

async function driveWorker() {
    console.log("STARTING LOCAL WORKER DRIVER");
    console.log("===================================");

    const anonKey = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
    if (!anonKey) {
        console.error("ERROR: Missing Key");
        return;
    }

    let emptyCount = 0;
    const MAX_EMPTY_RETRIES = 3;

    while (true) {
        try {
            console.log("Triggering Worker...");
            const res = await fetch(WORKER_ENDPOINT, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${anonKey}` 
                },
                body: JSON.stringify({}) // Trigger payload
            });

            if (res.status !== 200) {
                const text = await res.text();
                console.error(`Worker Error (${res.status}):`, text);
                break; // Stop on error
            }

            const data = await res.json();
            console.log(`Worker Report:`, data);

            if (data.processed === 0) {
                emptyCount++;
                console.log(`Queue empty (${emptyCount}/${MAX_EMPTY_RETRIES}).`);
                if (emptyCount >= MAX_EMPTY_RETRIES) {
                    console.log("All work finished! Exiting.");
                    break;
                }
            } else {
                emptyCount = 0; // Reset if we found work
            }

            // Sleep 1s to be nice
            await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
            console.error("Network/Script Error:", err.message);
            break;
        }
    }
}

driveWorker();
