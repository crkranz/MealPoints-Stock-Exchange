import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

// Wrap your entire app with BrowserRouter (Router)
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
