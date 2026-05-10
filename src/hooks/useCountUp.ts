import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 1800, startOnMount = false) {
  const [value, setValue] = useState(startOnMount ? 0 : target);
  const started = useRef(startOnMount);

  function start() {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (startOnMount) start();
  }, [target]);

  return { value, start };
}
