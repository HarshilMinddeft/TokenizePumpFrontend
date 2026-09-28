import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const DEFAULT_WORDS = ['data', 'records', 'details', 'content', 'data'];

/** Branded loading panel with rotating status word. */
const Spinner = ({ words = DEFAULT_WORDS, className = '' }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 900);
    return () => window.clearInterval(id);
  }, [words.length]);

  return (
    <div className={`flex min-h-72 flex-col items-center justify-center gap-5 ${className}`}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-2xl bg-[conic-gradient(from_0deg,transparent_10%,var(--tf-indigo-500)_80%,transparent)] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] p-[3px]" />
        <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7.5 4.25h-1.6A1.9 1.9 0 0 0 4 6.15v11.7a1.9 1.9 0 0 0 1.9 1.9h11.2a1.9 1.9 0 0 0 1.9-1.9V6.15a1.9 1.9 0 0 0-1.9-1.9h-1.6m-3.3 6.75 1.9 1.9-1.9 1.9m2.75-3.8h.01m-5.5 0h.01M9.5 4.25a2.5 2.5 0 0 1 5 0v1.6a1.9 1.9 0 0 1-1.9 1.9h-1.2a1.9 1.9 0 0 1-1.9-1.9v-1.6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex h-6 items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
        <span>Loading</span>
        <motion.span
          key={words[index]}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          className="font-semibold text-indigo-600 dark:text-indigo-400"
        >
          {words[index]}
        </motion.span>
        <span className="animate-pulse">…</span>
      </div>
    </div>
  );
};

export default Spinner;
