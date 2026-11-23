"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealed(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <motion.div ref={ref} className={className} animate={revealed ? { y: [11, 0], opacity: [0.72, 1] } : undefined} transition={{ duration: 0.45, ease: "easeOut", delay }}>{children}</motion.div>;
}
