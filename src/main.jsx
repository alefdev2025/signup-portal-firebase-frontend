// main.jsx - Remove StrictMode to eliminate double renders
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // if you have global styles

//ReactDOM.createRoot(document.getElementById('root')).render(
//  // REMOVED: React.StrictMode that was causing double renders
//  <App />
//)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)