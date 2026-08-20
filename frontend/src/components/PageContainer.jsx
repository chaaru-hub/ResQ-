import React from 'react';
import { motion } from 'framer-motion';

export const PageContainer = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`space-y-4 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer = ({ children, className = '', delay = 0.05 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
