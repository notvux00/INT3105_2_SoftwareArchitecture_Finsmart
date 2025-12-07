
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const API_URL = "https://nvbdupcoynrzkrwyhrjc.supabase.co";
const LOGIN_ENDPOINT = `${API_URL}/functions/v1/login-limiting`;
const SAGA_ENDPOINT = `${API_URL}/functions/v1/create-transaction-saga`;

// CREDENTIALS
const USERNAME = "natuan01";
const PASSWORD = "123456";

async function runTrafficSpike() {
    console.log("STARTING AUTHENTICATED TRAFFIC SPIKE (Custom Auth)");
    console.log("==========================================================");

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || API_URL;
    const anonKey = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!anonKey) {
        console.error("❌ ERROR: Missing Key");
        return;
    }

    const supabase = createClient(supabaseUrl, anonKey);

    // 1. LOGIN to get User ID
    console.log(`Logging in as '${USERNAME}'...`);
    const loginRes = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`
        },
        body: JSON.stringify({ username: USERNAME, password: PASSWORD })
    });

    if (loginRes.status !== 200) {
        console.error("Login Failed:", await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const userId = loginData.user_id; // Structure from authAPI.js

    if (!userId) {
        console.error("No user_id in login response:", loginData);
        return;
    }
    console.log(`Logged in! User ID: ${userId}`);

    // 2. Fetch VALID Wallet AND Category
    console.log("Fetching User Wallet...");
    const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('wallet_id')
        .eq('user_id', userId)
        .limit(1);

    if (walletError || !wallets || wallets.length === 0) {
        console.error("No Wallet found for user (or DB Error):", walletError);
        return;
    }

    const { data: categories } = await supabase.from('categories').select('name').limit(1);
    const validCategory = categories && categories.length > 0 ? categories[0].name : "Ăn uống";

    const walletId = wallets[0].wallet_id;
    console.log(`Wallet Found: ${walletId} | Category: ${validCategory}`);

    // 3. SPIKE ATTACK (DESTRUCTIVE MODE)
    const CONCURRENT_REQUESTS = 2000;
    console.log(`\nDESTRUCTIVE MODE: Sending ${CONCURRENT_REQUESTS} requests... PREPARE FOR IMPACT!`);

    const payload = {
        user_id: userId, 
        wallet_id: walletId, 
        category: validCategory, 
        amount: 1000,
        date: new Date().toISOString(),
        type: "thu", // Forces UPDATE wallet balance (Write Lock)
        note: "Spike Test"
    };

    const requests = Array(CONCURRENT_REQUESTS).fill(0).map((_, i) => {
        const p = { ...payload, idempotency_key: `spike-real-${Date.now()}-${i}-${Math.random()}` };
        
        return fetch(SAGA_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}` 
            },
            body: JSON.stringify(p)
        }).then(async res => {
           if (res.status >= 400 && i === 0) { 
               // Print first error body
               const txt = await res.text();
               console.log("Sample Error Body:", txt);
           }
           return res.status;
        }).catch(err => 999);
    });

    const start = performance.now();
    const results = await Promise.all(requests);
    const end = performance.now();

    const duration = (end - start) / 1000;
    console.log(`\nFinished in ${duration.toFixed(2)}s`);
    
    let stats = { 200: 0, 400: 0, 500: 0, 999: 0 };
    results.forEach(s => {
        if (s >= 200 && s < 300) stats[200]++;
        else if (s >= 400 && s < 500) stats[400]++;
        else if (s >= 500 && s < 600) stats[500]++;
        else stats[999]++;
    });

    console.log(`\nRESULTS:`);
    console.log(`Success (200/201): ${stats[200]}`);
    console.log(`Client Error (4xx): ${stats[400]}`);
    console.log(`Server Error (500 - Valid Failures): ${stats[500]}`);
    console.log(`Network Error (999): ${stats[999]}`);

    if (stats[500] > 0 || stats[999] > 0) {
        console.log("\nSYSTEM CRASHED / TIMED OUT under load.");
    } else {
        console.log("\nSYSTEM STABLE (All requests handled).");
    }
}

runTrafficSpike();

