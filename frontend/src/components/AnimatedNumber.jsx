import React, { useState, useEffect } from 'react';

export const AnimatedNumber = ({ value, duration = 800, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Extract numerical part from value (e.g. "87%", "38,400", 5)
    let numericTarget = 0;
    if (typeof value === 'number') {
      numericTarget = value;
    } else if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
      numericTarget = isNaN(parsed) ? 0 : parsed;
    }

    if (numericTarget === 0) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out quad formula
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(easeProgress * numericTarget);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    requestAnimationFrame(updateCount);
  }, [value, duration]);

  const formatted = displayValue.toLocaleString();

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
};
