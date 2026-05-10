import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

type Props = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  duration?: number;
  className?: string;
};

export function StatCounter({ value, suffix = "", prefix = "", label, icon: Icon, duration = 1600, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={`flex flex-col sm:flex-row items-center justify-center gap-3 py-7 px-4 text-center sm:text-left ${className}`}
    >
      {Icon && (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand/8 dark:bg-brand/15">
          <Icon className="h-5 w-5 text-brand" />
        </div>
      )}
      <div>
        <p className="text-2xl font-extrabold text-brand leading-none">
          {prefix}{displayed.toLocaleString()}{suffix}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
