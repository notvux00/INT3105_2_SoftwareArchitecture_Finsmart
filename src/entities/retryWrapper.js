export async function retryWrapper(fn, maxRetries = 3, delayMs = 500) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log("dang o lan thu i");
      return await fn(); 
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error(`API failed after ${maxRetries} attempts.`, error);
        throw error;
      }
      console.warn(`Attempt ${i + 1}/${maxRetries} failed. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}
