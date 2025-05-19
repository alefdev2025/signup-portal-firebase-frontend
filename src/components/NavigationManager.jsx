// src/components/NavigationManager.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { 
  getCriticalNavigation, 
  clearCriticalNavigation,
  getForceNavigation,
  clearForceNavigation,
  isNavigationBlocked,
  isAccountLinkingActive
} from '../services/storage';

// Priority levels for navigation
const NAVIGATION_PRIORITIES = {
  CRITICAL: 100,   // Immediate, overrides everything (account linking)
  HIGH: 80,        // Authentication/security related
  MEDIUM: 60,      // Normal step navigation
  LOW: 40,         // Convenience redirects
  SUGGESTION: 20   // User hints, can be ignored
};

const NavigationManager = () => {
  const { redirectTo, isLoading, authResolved } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingNavigations, setPendingNavigations] = useState([]);
  
  // Debug logging
  const log = (message) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/log?t=${Date.now()}`, false);
      xhr.send(`[NAVIGATION] ${message}`);
      console.log(`[NAVIGATION] ${message}`);
    } catch (e) {
      // Ignore errors
    }
  };
  
  // Listen for navigation requests from localStorage
  useEffect(() => {
    const checkNavigationRequests = () => {
      // Skip if navigation is blocked or account linking is active
      if (isNavigationBlocked() || isAccountLinkingActive()) {
        return;
      }
      
      // Check for critical navigation
      const criticalNavigation = getCriticalNavigation();
      if (criticalNavigation && criticalNavigation.path) {
        log(`Critical navigation detected: ${criticalNavigation.path}`);
        setPendingNavigations(current => [
          ...current.filter(nav => nav.priority !== NAVIGATION_PRIORITIES.CRITICAL),
          {
            path: criticalNavigation.path,
            priority: NAVIGATION_PRIORITIES.CRITICAL,
            timestamp: criticalNavigation.timestamp,
            replace: true
          }
        ]);
        // Clear after processing
        clearCriticalNavigation();
      }
      
      // Check for force navigation
      const forceNavigation = getForceNavigation();
      if (forceNavigation) {
        const stepValue = forceNavigation.step;
        const paths = ["", "/success", "/contact", "/package", "/funding", "/membership"];
        const path = `/signup${paths[stepValue] || ""}`;
        
        log(`Force navigation detected: ${path} (step ${stepValue})`);
        setPendingNavigations(current => [
          ...current.filter(nav => nav.priority !== NAVIGATION_PRIORITIES.HIGH),
          {
            path: path,
            priority: NAVIGATION_PRIORITIES.HIGH,
            timestamp: forceNavigation.timestamp,
            replace: true
          }
        ]);
        // Clear after processing
        clearForceNavigation();
      }
      
      // Add context-based redirects
      if (redirectTo && !isLoading && authResolved) {
        setPendingNavigations(current => [
          ...current.filter(nav => nav.priority !== NAVIGATION_PRIORITIES.MEDIUM),
          {
            path: redirectTo,
            priority: NAVIGATION_PRIORITIES.MEDIUM,
            timestamp: Date.now(),
            replace: true
          }
        ]);
      }
    };
    
    // Run initially
    checkNavigationRequests();
    
    // Set up interval to check regularly
    const interval = setInterval(checkNavigationRequests, 300);
    
    return () => clearInterval(interval);
  }, [redirectTo, isLoading, authResolved]);
  
  // Process pending navigations
  useEffect(() => {
    if (pendingNavigations.length > 0 && !isLoading && !isNavigationBlocked() && !isAccountLinkingActive()) {
      // Sort by priority (highest first), then by timestamp (newest first)
      const sorted = [...pendingNavigations].sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.timestamp - a.timestamp;
      });
      
      // Get highest priority navigation
      const nextNavigation = sorted[0];
      
      // Don't navigate to current path
      if (nextNavigation.path === location.pathname) {
        log(`Already at ${nextNavigation.path}, removing from queue`);
        setPendingNavigations(current => 
          current.filter(nav => nav.path !== location.pathname)
        );
        return;
      }
      
      // Perform navigation
      log(`Executing navigation to: ${nextNavigation.path} (priority: ${nextNavigation.priority})`);
      navigate(nextNavigation.path, { replace: nextNavigation.replace });
      
      // Clear this navigation
      setPendingNavigations(current => 
        current.filter(nav => nav !== nextNavigation)
      );
    }
  }, [pendingNavigations, navigate, location.pathname, isLoading]);
  
  // No UI rendering
  return null;
};

export default NavigationManager;