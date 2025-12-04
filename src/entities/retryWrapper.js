export async function retryWrapper(fn, maxRetries = 3, initialDelayMs = 500) {
  const maxDelayMs = 10000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log("dang o lan thu i");
      return await fn(); 
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error(`API failed after ${maxRetries} attempts.`, error);
        throw error;
      }
      let backoffDelay = initialDelayMs * Math.pow(2, i);
      
      backoffDelay = Math.min(backoffDelay, maxDelayMs);
      
      const jitterDelay = Math.floor(Math.random() * backoffDelay);
      
      const actualDelay = jitterDelay;
      
      console.warn(`Attempt ${i + 1}/${maxRetries} failed. Retrying in ${actualDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }
}
