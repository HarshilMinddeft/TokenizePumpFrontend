import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Web3Provider } from '../context/Web3Context.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

// No <StrictMode>. This was originally needed because the old TrueFraction
// landing page (src/features/landing) booted a WebGL scene directly in a
// bare useEffect, and StrictMode's dev-mode double-invoke would boot two.
// The current landing page (StationLanding) renders its 3D scene as an
// iframe with a cleanup-safe polling effect, so that specific reason no
// longer applies — re-enabling StrictMode is a separate decision, since it
// would also affect the rest of the app (Web3Context, etc.), not evaluated
// as part of this change.
createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <BrowserRouter>
      <Web3Provider>
        <App />
      </Web3Provider>
    </BrowserRouter>
  </ThemeProvider>,
);
