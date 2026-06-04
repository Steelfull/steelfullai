'use client';

import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

export function AnimatedNumber({
  value,
  decimals = 0,
  locale = 'en',
  className,
}: {
  value: number;
  decimals?: number;
  locale?: string;
  className?: string;
}) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 22, mass: 0.6 });
  const display = useTransform(spring, (v) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.max(0, v))
  );

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
