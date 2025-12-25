import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import NotFound from './components/NotFound';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

// Simple SPA path handling: show app only on the expected base path.
// If you host the app under a subpath, adjust acceptedPaths accordingly.
const acceptedPaths = ['/', '/index.html'];
const currentPath = window.location.pathname || '/';

root.render(
  <React.StrictMode>
    {acceptedPaths.includes(currentPath) ? <App /> : <NotFound />}
  </React.StrictMode>
);