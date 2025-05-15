// src/components/NavigationManager.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const NavigationManager = () => {
  const { redirectTo, isLoading, authResolved } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && authResolved && redirectTo) {
      navigate(redirectTo, { replace: true });
    }
  }, [redirectTo, navigate, isLoading, authResolved]);
  
  return null; // This component doesn't render anything
};

export default NavigationManager;