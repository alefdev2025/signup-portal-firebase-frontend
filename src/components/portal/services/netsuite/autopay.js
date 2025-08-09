// services/netsuite/autopay.js
import { NETSUITE_API_BASE, REQUEST_TIMEOUT } from './config';

/**
 * Get customer autopay status based on sales order analysis
 * This uses the new sales order endpoint to determine actual autopay behavior
 * rather than relying on the unreliable customer flag
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Autopay status data based on payment behavior
 */
export const getCustomerAutopayStatus = async (customerId) => {
  try {
    console.log(`Analyzing autopay status for customer ${customerId} using sales orders`);
    
    // Use the new autopay analysis endpoint that looks at sales orders
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/autopay-analysis`;
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('Autopay analysis response:', result);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Transform the sales order analysis into autopay status
    const analysis = result.analysis || {};
    const billingPattern = result.billingPattern || {};
    
    // Determine autopay status based on payment method analysis
    const autopayEnabled = analysis.autopayStatus === 'ON_AUTOPAY' || 
                          (analysis.autopayStatus === 'LIKELY_AUTOPAY' && analysis.confidence >= 70);
    
    const enhancedAutopayData = {
      // Core autopay status (based on actual behavior, not flag)
      autopayEnabled: autopayEnabled,
      autopayStatus: analysis.autopayStatus || 'UNKNOWN',
      confidence: analysis.confidence || 0,
      lastChecked: new Date().toISOString(),
      
      // Payment method details from sales orders
      paymentMethodId: analysis.cardOnFile ? 'CARD_ON_FILE' : null,
      paymentMethodType: analysis.latestPaymentMethod || null,
      cardDetails: analysis.cardOnFile || null,
      
      // Billing information
      billingSchedule: billingPattern.type || 'UNKNOWN',
      billingFrequency: billingPattern.frequency || null,
      estimatedSchedule: billingPattern.estimatedSchedule || null,
      
      // Evidence and reasoning
      evidence: analysis.evidence || [],
      
      // Additional metadata
      totalOrders: result.totalOrders || 0,
      hasOrders: result.hasOrders || false,
      lastModified: null, // Not applicable for analysis-based status
      modifiedBy: 'SYSTEM_ANALYSIS'
    };
    
    return {
      success: true,
      ...enhancedAutopayData,
      customerId: customerId,
      timestamp: result.timestamp || new Date().toISOString(),
      summary: result.summary || generateAutopaySummary(enhancedAutopayData)
    };
  } catch (error) {
    console.error('Error fetching autopay status:', error);
    throw error;
  }
};

/**
 * Update customer autopay status FLAG in NetSuite
 * 
 * IMPORTANT: This updates the customer flag in NetSuite but this flag is NOT reliable
 * for determining actual autopay status. The flag is kept for legacy/administrative purposes.
 * 
 * To determine actual autopay status, use getCustomerAutopayStatus() which analyzes
 * sales orders and payment methods.
 * 
 * @param {string} customerId - NetSuite customer ID
 * @param {boolean} enabled - Whether to enable or disable the autopay flag
 * @returns {Promise<object>} Update response
 */
export const updateCustomerAutopayStatus = async (customerId, enabled) => {
  try {
    console.log(`Updating autopay FLAG for customer ${customerId} to ${enabled}`);
    console.log('NOTE: This updates the customer flag only. Actual autopay behavior is determined by payment methods on sales orders.');
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/autopay`;
    
    const fetchPromise = fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        enabled: enabled
      })
    });
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('Autopay flag update response:', result);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // After updating the flag, fetch the actual analysis-based status
    const actualStatus = await getCustomerAutopayStatus(customerId);
    
    return {
      success: result.success || true,
      // Flag status (what was updated)
      flagStatus: enabled,
      previousFlagStatus: result.previousStatus,
      
      // Actual autopay status (based on behavior)
      actualAutopayStatus: actualStatus.autopayEnabled,
      autopayAnalysis: actualStatus,
      
      message: result.message || `Autopay flag ${enabled ? 'enabled' : 'disabled'}. Note: Actual autopay status depends on payment methods used on sales orders.`,
      customerId: customerId,
      timestamp: result.timestamp || new Date().toISOString(),
      
      // Warning if flag doesn't match actual behavior
      warning: (enabled !== actualStatus.autopayEnabled) ? 
        `Flag set to ${enabled} but actual behavior indicates autopay is ${actualStatus.autopayEnabled ? 'enabled' : 'disabled'}` : 
        null
    };
  } catch (error) {
    console.error('Error updating autopay flag:', error);
    throw error;
  }
};

/**
 * Get customer's billing summary
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Billing summary including schedule and next payment
 */
export const getCustomerBillingSummary = async (customerId) => {
  try {
    console.log(`Fetching billing summary for customer ${customerId}`);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/billing-summary`;
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    throw error;
  }
};

/**
 * Get customer's latest payment method
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Latest payment method details
 */
export const getCustomerPaymentMethod = async (customerId) => {
  try {
    console.log(`Fetching payment method for customer ${customerId}`);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/payment-method`;
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching payment method:', error);
    throw error;
  }
};

/**
 * Get autopay history for a customer (analyzes payment methods from sales orders)
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Payment method history from sales orders
 */
export const getCustomerAutopayHistory = async (customerId, options = {}) => {
  try {
    console.log(`Fetching payment history for customer ${customerId}`, options);
    
    // Get sales orders to analyze payment method changes
    const queryParams = new URLSearchParams({
      limit: options.limit || 50,
      offset: options.offset || 0,
      includePaymentDetails: 'true'
    });
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/sales-orders?${queryParams.toString()}`;
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Transform sales orders into autopay history
    const orders = result.data || [];
    const history = orders.map(order => ({
      date: order.date,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentInfo?.paymentMethodName || 'Unknown',
      hasCardOnFile: order.paymentInfo?.hasCardOnFile || false,
      isLinkToPay: order.paymentInfo?.isLinkToPay || false,
      cardDetails: order.paymentInfo?.cardDetails || null,
      amount: order.total,
      billingSchedule: order.billingSchedule?.scheduleName || null
    }));
    
    return {
      success: true,
      history: history,
      count: history.length,
      totalCount: result.totalCount || history.length,
      customerId: customerId,
      timestamp: new Date().toISOString(),
      pagination: {
        offset: options.offset || 0,
        limit: options.limit || 50,
        hasMore: result.hasMore || false
      }
    };
  } catch (error) {
    console.error('Error fetching autopay history:', error);
    throw error;
  }
};

/**
 * Verify autopay can be enabled (check for valid payment method)
 * 
 * IMPORTANT BUSINESS LOGIC:
 * - Customer is ONLY eligible if they are NOT currently on autopay
 * - If they're already on autopay, they must be manually removed by staff
 * - Must have a valid card on file (not Link to Pay) to be eligible
 * 
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Verification result
 */
export const verifyAutopayEligibility = async (customerId) => {
  try {
    console.log(`Verifying autopay eligibility for customer ${customerId}`);
    
    // Get payment method and autopay analysis
    const [paymentMethod, autopayStatus] = await Promise.all([
      getCustomerPaymentMethod(customerId),
      getCustomerAutopayStatus(customerId)
    ]);
    
    // Check if already on autopay (makes them ineligible)
    const isAlreadyOnAutopay = autopayStatus.autopayStatus === 'ON_AUTOPAY' || 
                               (autopayStatus.autopayStatus === 'LIKELY_AUTOPAY' && autopayStatus.confidence >= 70);
    
    // Basic requirements for autopay
    const hasValidPaymentMethod = paymentMethod.hasCardOnFile && !paymentMethod.isLinkToPay;
    
    // Customer is eligible ONLY if:
    // 1. They are NOT already on autopay
    // 2. They have a valid payment method
    const eligible = !isAlreadyOnAutopay && hasValidPaymentMethod;
    
    // Determine reason for ineligibility
    let reason = null;
    let recommendations = [];
    
    if (isAlreadyOnAutopay) {
      reason = 'Customer is already on autopay';
      recommendations = [
        'Customer must contact support to disable autopay',
        'Staff intervention required to remove from autopay'
      ];
    } else if (!paymentMethod.hasCardOnFile) {
      reason = 'No payment method on file';
      recommendations = ['Customer needs to add a valid payment method'];
    } else if (paymentMethod.isLinkToPay) {
      reason = 'Customer uses Link to Pay - not compatible with autopay';
      recommendations = ['Customer needs to add a stored payment method'];
    }
    
    return {
      success: true,
      eligible: eligible,
      reason: reason,
      isAlreadyOnAutopay: isAlreadyOnAutopay,
      hasValidPaymentMethod: hasValidPaymentMethod,
      currentPaymentMethod: paymentMethod.paymentMethod,
      autopayAnalysis: {
        status: autopayStatus.autopayStatus,
        confidence: autopayStatus.confidence,
        cardDetails: autopayStatus.cardDetails
      },
      recommendations: recommendations,
      customerId: customerId,
      // Additional context for UI
      requiresStaffIntervention: isAlreadyOnAutopay
    };
  } catch (error) {
    console.error('Error verifying autopay eligibility:', error);
    throw error;
  }
};

// Helper function to generate summary text
function generateAutopaySummary(autopayData) {
  const { autopayStatus, confidence, cardDetails, billingSchedule } = autopayData;
  
  let summary = '';
  
  switch (autopayStatus) {
    case 'ON_AUTOPAY':
      summary = `Customer is on autopay (${confidence}% confidence)`;
      if (cardDetails) {
        summary += ` using ${cardDetails.type} ending in ${cardDetails.last4}`;
      }
      break;
    case 'NOT_ON_AUTOPAY':
      summary = `Customer is not on autopay (${confidence}% confidence) - uses Link to Pay`;
      break;
    case 'LIKELY_AUTOPAY':
      summary = `Customer likely on autopay (${confidence}% confidence)`;
      break;
    case 'LIKELY_NOT_AUTOPAY':
      summary = `Customer likely not on autopay (${confidence}% confidence)`;
      break;
    default:
      summary = 'Autopay status cannot be determined';
  }
  
  if (billingSchedule && billingSchedule !== 'UNKNOWN') {
    summary += `. Billing schedule: ${billingSchedule}`;
  }
  
  return summary;
}