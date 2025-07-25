import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
// import * as Sentry from '@sentry/react';
// import { BrowserTracing } from '@sentry/tracing';

// Sentry.init({
//   dsn: 'TU_DSN_DE_SENTRY', // Reemplaza con tu DSN real
//   integrations: [new BrowserTracing()],
//   tracesSampleRate: 1.0,
// });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
); 