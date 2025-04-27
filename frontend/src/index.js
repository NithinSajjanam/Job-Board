import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './AppNew'; // Using the new App component
import './style.css';
import { UIProvider } from './context/UIContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UIProvider>
      <App />
    </UIProvider>
  </React.StrictMode>
);
