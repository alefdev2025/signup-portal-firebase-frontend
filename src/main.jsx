// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // COMMENTED OUT

console.log('=== VIEWPORT DEBUG ===');
console.log('Initial viewport:', window.innerWidth, 'x', window.innerHeight);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)