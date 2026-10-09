import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'tf-theme';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

// Light theme isn't finished yet, so the toggle is hidden and everyone gets
// dark — including visitors who saved 'light' earlier. To bring it back,
// restore the stored value here and re-add <ThemeToggle /> to the top bars.
const getInitialTheme = () => 'dark';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        const next = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!document.startViewTransition || reduceMotion) {
          next();
          return;
        }

        const transition = document.startViewTransition(next);

        transition.ready.then(() => {
          document.documentElement.animate(
            { opacity: [0, 1], transform: ['scale(0.98)', 'scale(1)'] },
            { duration: 450, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' },
          );
          document.documentElement.animate(
            { opacity: [1, 0] },
            { duration: 450, easing: 'ease-out', pseudoElement: '::view-transition-old(root)' },
          );
        });
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
