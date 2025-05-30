// File: vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create or clear log file
const logFile = path.join(logsDir, 'account-linking.log');
fs.writeFileSync(logFile, `--- LOG STARTED ${new Date().toISOString()} ---\n`);

// Function to write to log file
function writeToLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Write to log file
  fs.appendFileSync(logFile, logMessage);
  
  // Also print to console
  console.log(logMessage.trim());
}

// Log startup
writeToLog('VITE SERVER STARTED');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      overlay: false
    }
  },
  // Standard Stripe configuration that actually works
  optimizeDeps: {
    include: ['@stripe/stripe-js']
  }
});