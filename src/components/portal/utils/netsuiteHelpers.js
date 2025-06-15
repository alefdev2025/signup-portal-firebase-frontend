// utils/netsuiteHelpers.js
/**
 * Format currency for display
 * @param {string|number} amount - Amount to format
 * @param {string} currency - Currency code (USD, EUR, etc.)
 * @returns {string} Formatted currency string
 */
 export const formatCurrency = (amount, currency = 'USD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };
  
  /**
   * Format date for display
   * @param {string} dateString - Date string from NetSuite
   * @returns {string} Formatted date
   */
  export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  /**
   * Get invoice status badge color
   * @param {string} status - Invoice status
   * @returns {string} CSS class for status badge
   */
  export const getStatusColor = (status) => {
    const statusColors = {
      'open': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'pending': 'bg-blue-100 text-blue-800',
      'partially_paid': 'bg-orange-100 text-orange-800'
    };
    
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };
  
  /**
   * Calculate days until due
   * @param {string} dueDate - Due date string
   * @returns {number} Days until due (negative if overdue)
   */
  export const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };