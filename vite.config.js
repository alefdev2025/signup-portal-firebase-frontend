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
  plugins: [
    // DISABLE FAST REFRESH to prevent CardElement destruction
    react({
      fastRefresh: false,
      // Also disable some other development features that might interfere
      jsxImportSource: undefined
    }),
    {
      name: 'file-logger',
      configureServer(server) {
        // Log server start
        writeToLog('🔴 FILE LOGGER ACTIVATED 🔴');
        
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/api/log')) {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              writeToLog(`CLIENT: ${body}`);
              res.end('OK');
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 5173,
    // Also disable HMR for payment pages
    hmr: {
      overlay: false
    }
  }
});