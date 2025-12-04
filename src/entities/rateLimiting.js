const RL_CHECK_URL = "https://nvbdupcoynrzkrwyhrjc.supabase.co/functions/v1/rl-check"; 

export async function rateLimitCheck(userId) {
    
    const rlResponse = await fetch(RL_CHECK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
         },
        body: JSON.stringify({ userId }), 
    });

    if (rlResponse.status === 429) {
        console.error(`Rate Limit hit for user ${userId}. Aborting call.`);
        
        const error = new Error('Rate Limit Exceeded (429)');
        error.status = 429; 
        console.log("nem loi ra luon")
        throw error; 
    }
    else {
        console.log("ok bu");
        return 1;
    }
}
