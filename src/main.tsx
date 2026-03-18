import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Terms from './Terms.tsx'

function Router() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);

    // Intercept link clicks for SPA navigation
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && target.origin === window.location.origin && !target.target) {
        e.preventDefault();
        window.history.pushState({}, '', target.href);
        setPath(new URL(target.href).pathname);
        window.scrollTo(0, 0);
      }
    };
    document.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
    };
  }, []);

  if (path === '/terms') return <Terms />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
