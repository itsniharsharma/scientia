// A FIFO request queue: each enqueued task only starts once every task
// enqueued before it has settled. This guarantees requests reach the server
// in the order they were made, so a slower earlier request can never
// complete after (and overwrite the effect of) a faster later one.
export function createRequestQueue() {
  let tail: Promise<unknown> = Promise.resolve();

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    // `tail` is an invariant: it always resolves, never rejects (see below),
    // so a plain success handler is enough to chain onto it.
    const run = tail.then(task);
    // Keep the chain alive even if this task rejects, so later tasks still
    // run and callers awaiting `settled()` don't hang or throw on old failures.
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  // Resolves once every task enqueued so far has settled (success or failure).
  function settled(): Promise<void> {
    return tail as Promise<void>;
  }

  return { enqueue, settled };
}
