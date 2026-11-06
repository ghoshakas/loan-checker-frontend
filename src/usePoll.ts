import { useEffect } from "react";

/** Call `fn` every `ms` while `active` is true (e.g. while AI screening runs). */
export function usePoll(active: boolean, fn: () => void, ms = 4000) {
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(fn, ms);
    return () => window.clearInterval(t);
  }, [active, fn, ms]);
}
