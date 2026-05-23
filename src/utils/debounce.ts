/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a queue-based save function that ensures only one save operation runs at a time.
 * If a save is requested while another is in progress, it will be queued.
 */
export function createSaveQueue<T extends (...args: any[]) => Promise<any>>(
  saveFunc: T
): (...args: Parameters<T>) => Promise<void> {
  let pending: Promise<any> | null = null;
  let nextArgs: Parameters<T> | null = null;

  async function processSave(args: Parameters<T>): Promise<void> {
    try {
      await saveFunc(...args);
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  }

  return async function (...args: Parameters<T>): Promise<void> {
    nextArgs = args;

    if (pending) {
      // Wait for current save to finish, then process queued save
      await pending;
      if (nextArgs) {
        const argsToSave = nextArgs;
        nextArgs = null;
        pending = processSave(argsToSave);
        await pending;
        pending = null;
      }
    } else {
      // No save in progress, start immediately
      pending = processSave(args);
      await pending;
      pending = null;
    }
  };
}
