// File: /Users/nikkiolson/Development/Alcor/alcor-signup-portal/src/components/debug/logs.jsx

import { useState, useEffect } from 'react';

// Debug logger utility
export const debugLogger = {
  log: function(area, message, data = null) {
    const timestamp = new Date().toISOString();
    const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
    
    const logEntry = {
      timestamp,
      area,
      message,
      data: data ? (typeof data === 'object' ? JSON.stringify(data) : data) : null
    };
    
    logs.push(logEntry);
    console.log(`[${area}] ${message}`, data);
    
    // Keep only last 200 logs to avoid storage issues
    if (logs.length > 200) logs.shift();
    
    sessionStorage.setItem('debug_logs', JSON.stringify(logs));
    
    // Auto-send logs to terminal if we have accumulated a few
    if (logs.length % 5 === 0) {
      this.sendLogsToTerminal();
    }
  },
  
  error: function(area, message, error = null) {
    const errorData = error ? {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    } : null;
    
    this.log(area, message, errorData);
  },
  
  viewLogs: function() {
    return JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
  },
  
  clearLogs: function() {
    sessionStorage.removeItem('debug_logs');
    console.log('Debug logs cleared');
    return [];
  },
  
  // New method to print logs to console
  printToConsole: function() {
    const logs = this.viewLogs();
    if (logs.length === 0) {
      console.log('No debug logs to display');
      return logs;
    }
    
    console.group('===== DEBUG LOGS =====');
    logs.forEach((log, i) => {
      console.log(`[${log.timestamp}] [${log.area}] ${log.message}`, log.data ? JSON.parse(log.data) : '');
    });
    console.groupEnd();
    return logs;
  },
  
  // New method to send logs to terminal
  sendLogsToTerminal: function() {
    const logs = this.viewLogs();
    if (logs.length === 0) return;
    
    // Send logs to the server using fetch
    fetch('/api/debug-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logs)
    }).catch(err => {
      console.error('Failed to send logs to terminal:', err);
    });
  },
  
  // Auto-print logs periodically
  startAutoPrint: function(intervalMs = 5000) {
    console.log('Starting auto-print of logs every', intervalMs, 'ms');
    const intervalId = setInterval(() => {
      this.printToConsole();
    }, intervalMs);
    
    return () => {
      console.log('Stopping auto-print of logs');
      clearInterval(intervalId);
    };
  },
  
  // Add terminal log button
  addTerminalLogButton: function() {
    // Remove any existing button first
    const existingButton = document.getElementById('terminal-log-button');
    if (existingButton) {
      existingButton.remove();
    }
    
    // Create a button to send logs to terminal
    const logButton = document.createElement('button');
    logButton.id = 'terminal-log-button';
    logButton.textContent = 'SEND LOGS TO TERMINAL';
    logButton.style.position = 'fixed';
    logButton.style.bottom = '10px';
    logButton.style.left = '10px';
    logButton.style.backgroundColor = 'blue';
    logButton.style.color = 'white';
    logButton.style.padding = '10px';
    logButton.style.zIndex = '9999';
    logButton.style.borderRadius = '4px';
    logButton.style.border = 'none';
    logButton.style.cursor = 'pointer';
    logButton.onclick = () => {
      this.sendLogsToTerminal();
      alert('Logs sent to terminal');
    };
    
    //document.body.appendChild(logButton);
    return logButton;
  },
  
  // Add console print button
  addConsolePrintButton: function() {
    // Remove any existing button first
    const existingButton = document.getElementById('console-print-button');
    if (existingButton) {
      existingButton.remove();
    }
    
    // Create a button to print logs to console
    const printButton = document.createElement('button');
    printButton.id = 'console-print-button';
    printButton.textContent = 'PRINT LOGS TO CONSOLE';
    printButton.style.position = 'fixed';
    printButton.style.bottom = '10px';
    printButton.style.left = '180px';
    printButton.style.backgroundColor = 'green';
    printButton.style.color = 'white';
    printButton.style.padding = '10px';
    printButton.style.zIndex = '9999';
    printButton.style.borderRadius = '4px';
    printButton.style.border = 'none';
    printButton.style.cursor = 'pointer';
    printButton.onclick = () => {
      this.printToConsole();
    };
    
    //document.body.appendChild(printButton);
    return printButton;
  }
};

// Make it globally accessible for console debugging
if (typeof window !== 'undefined') {
  window.debugLogger = debugLogger;
  
  // Add method to retrieve logs from console
  window.getLogs = () => {
    return debugLogger.viewLogs();
  };
  
  // Add methods to print logs
  window.printLogs = () => {
    return debugLogger.printToConsole();
  };
  
  // Add a helpful message on page load
  setTimeout(() => {
    console.info('Debug logging is enabled! Type window.printLogs() to view logs in console');
  }, 1000);
}

// Debug panel component
export const DebugPanel = ({ defaultVisible = false }) => {
  const [visible, setVisible] = useState(defaultVisible);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
    // Set up a key combination to show/hide (Alt+D)
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'd') {
        setVisible(v => !v);
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Update logs every second
    const interval = setInterval(() => {
      const storedLogs = debugLogger.viewLogs();
      setLogs(storedLogs);
    }, 1000);
    
    // Add buttons for log management
    const terminalButton = debugLogger.addTerminalLogButton();
    const consoleButton = debugLogger.addConsolePrintButton();
    
    // Start auto-printing logs every 10 seconds
    const stopAutoPrint = debugLogger.startAutoPrint(10000);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
      stopAutoPrint();
      
      // Remove buttons on unmount
      if (terminalButton && terminalButton.parentNode) {
        terminalButton.parentNode.removeChild(terminalButton);
      }
      if (consoleButton && consoleButton.parentNode) {
        consoleButton.parentNode.removeChild(consoleButton);
      }
    };
  }, []);
  
  if (!visible) {
    return (
      <div className="fixed bottom-2 right-2 z-50">
        <button
          className="bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-50 hover:opacity-100"
          onClick={() => setVisible(true)}
        >
          Show Logs
        </button>
      </div>
    );
  }
  
  // Filter logs based on search term
  const filteredLogs = filter
    ? logs.filter(log => 
        log.area.toLowerCase().includes(filter.toLowerCase()) ||
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        (log.data && log.data.toLowerCase().includes(filter.toLowerCase()))
      )
    : logs;
  
  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-gray-900 text-white p-4 overflow-auto z-50 text-xs rounded-tl-md shadow-lg border border-gray-700">
      <div className="flex justify-between mb-2 sticky top-0 bg-gray-900 pb-2 border-b border-gray-700">
        <h3 className="text-lg font-bold">Debug Logs ({logs.length})</h3>
        <div>
          <button 
            className="bg-blue-600 px-2 py-1 mr-2 rounded text-xs"
            onClick={() => {
              debugLogger.sendLogsToTerminal();
            }}
          >
            Send to Terminal
          </button>
          <button 
            className="bg-red-600 px-2 py-1 mr-2 rounded text-xs"
            onClick={() => {
              setLogs(debugLogger.clearLogs());
            }}
          >
            Clear
          </button>
          <button 
            className="bg-gray-600 px-2 py-1 rounded text-xs"
            onClick={() => setVisible(false)}
          >
            Hide
          </button>
        </div>
      </div>
      
      <div className="mb-2">
        <input
          type="text"
          placeholder="Filter logs..."
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-400 italic">No logs to display</div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="border-b border-gray-700 pb-2 hover:bg-gray-800 p-1">
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="bg-blue-900 px-1 rounded text-xs">{log.area}</span>
              </div>
              <div className="font-medium">{log.message}</div>
              {log.data && (
                <pre className="text-green-300 text-xs mt-1 overflow-x-auto bg-gray-800 p-1 rounded">
                  {log.data}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;