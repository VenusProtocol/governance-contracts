const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  attempts = 5,
  baseMs = 5000,
  maxMs = 60000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts - 1) break;
      const delay = Math.min(maxMs, baseMs * 2 ** attempt);
      console.warn(`[retry] ${label} attempt ${attempt + 1}/${attempts} failed, retrying in ${delay}ms:`, err);
      await sleep(delay);
    }
  }
  throw lastError;
}
