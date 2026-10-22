// A tiny signal for "is the loading screen up?". Components that animate on
// arrival (the birthday card) wait on it, so their entrance is not spent
// hidden behind the loader.

let loading = true;
const waiters = new Set();

export function setAppLoading(value) {
  loading = value;
  if (loading) return;
  for (const resolve of waiters) resolve();
  waiters.clear();
}

/** Resolves as soon as no loading screen is showing. */
export function whenAppIdle() {
  return loading ? new Promise((resolve) => waiters.add(resolve)) : Promise.resolve();
}
