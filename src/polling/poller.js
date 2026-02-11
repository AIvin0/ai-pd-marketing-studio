export function startPoll({
    intervalMs = 3000,
    maxAttempts = 60,
    signal, // AbortSignal (optional)
    run, // async ({ attempt, signal }) => { done: boolean, value?: any }
    onTick, // (attempt) => void
    onDone, // (value) => void
    onTimeout, // () => void
    onError, // (err) => void
  }) {
    let stopped = false;
    let attempt = 0;
    let timeoutId = null;
  
    const stop = () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  
    const loop = async () => {
      if (stopped) return;
      if (signal?.aborted) return;
  
      attempt += 1;
      onTick?.(attempt);
  
      try {
        const res = await run({ attempt, signal });
        if (stopped) return;
        if (signal?.aborted) return;
  
        if (res?.done) {
          onDone?.(res.value);
          return;
        }
  
        if (attempt >= maxAttempts) {
          onTimeout?.();
          return;
        }
  
        timeoutId = setTimeout(loop, intervalMs);
      } catch (e) {
        // Abort는 조용히 종료
        if (signal?.aborted) return;
  
        onError?.(e);
  
        if (attempt >= maxAttempts) {
          onTimeout?.();
          return;
        }
  
        timeoutId = setTimeout(loop, intervalMs);
      }
    };
  
    // start
    timeoutId = setTimeout(loop, intervalMs);
  
    return stop;
  }
  