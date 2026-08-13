/** In-flight summary runs across all pipelines, awaited on shutdown. */
const pending = new Set<Promise<unknown>>();

export function track(promise: Promise<unknown>) {
    pending.add(promise);
    void promise.finally(() => pending.delete(promise));
}

export async function awaitPending() {
    await Promise.allSettled([...pending]);
}
