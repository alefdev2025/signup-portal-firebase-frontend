// InvoicesComponents/utils/invoiceHelpers.js

/**
 * Process invoices to calculate status and merge with payment data
 * Now handles the payment status that comes from the backend
 */
 export const processInvoices = (invoicesData, paymentsData) => {
    try {
      // Extract the actual invoice array - be defensive about the structure
      let invoices = [];
      
      if (!invoicesData) {
        console.log('No invoice data provided');
        return [];
      }
      
      // Handle different possible structures
      if (Array.isArray(invoicesData)) {
        invoices = invoicesData;
      } else if (invoicesData.invoices && Array.isArray(invoicesData.invoices)) {
        invoices = invoicesData.invoices;
      } else if (invoicesData.data && Array.isArray(invoicesData.data)) {
        invoices = invoicesData.data;
      } else {
        console.log('Invalid invoice data structure:', invoicesData);
        return [];
      }
      
      if (invoices.length === 0) {
        console.log('No invoices to process');
        return [];
      }
      
      // Extract payments array - also be defensive
      let payments = [];
      
      if (paymentsData) {
        if (Array.isArray(paymentsData)) {
          payments = paymentsData;
        } else if (paymentsData.payments && Array.isArray(paymentsData.payments)) {
          payments = paymentsData.payments;
        } else if (paymentsData.data && Array.isArray(paymentsData.data)) {
          payments = paymentsData.data;
        }
      }
      
      console.log(`Processing ${invoices.length} invoices with ${payments.length} payments`);
  
      // Process each invoice
      const processedInvoices = invoices.map(invoice => {
        // Ensure invoice object exists
        if (!invoice) {
          console.warn('Null or undefined invoice in array');
          return null;
        }
        
        const amountRemaining = parseFloat(invoice.amountRemaining || 0);
        const total = parseFloat(invoice.total || 0);
        
        // Start with backend-provided payment status if available
        let status = invoice.paymentStatus || invoice.status || 'Open';
        let hasUnappliedPayment = invoice.hasUnappliedPayment || false;
        let matchedPayment = invoice.matchedPayment || null;
        
        // If backend didn't provide payment status, calculate it ourselves (fallback)
        if (!invoice.paymentStatus) {
          // Check if invoice is fully paid
          if (amountRemaining <= 0) {
            status = 'Paid';
          } 
          // Check for unapplied payments matching this invoice
          else if (payments.length > 0) {
            // Find any unapplied payment that might match this invoice
            const unappliedPayment = payments.find(payment => {
              const unappliedAmount = parseFloat(payment.unapplied || 0);
              if (unappliedAmount <= 0) return false;
              
              // Check if payment amount matches invoice amount
              return Math.abs(unappliedAmount - total) < 0.01 || 
                     Math.abs(unappliedAmount - amountRemaining) < 0.01;
            });
            
            if (unappliedPayment) {
              status = 'Pending';  // Changed from 'Payment Submitted'
              hasUnappliedPayment = true;
              matchedPayment = {
                id: unappliedPayment.id,
                documentNumber: unappliedPayment.documentNumber,
                amount: unappliedPayment.amount,
                unapplied: unappliedPayment.unapplied
              };
            }
          }
        } else {
          // Convert backend payment status to display status
          switch (invoice.paymentStatus) {
            case 'PAID':
              status = 'Paid';
              break;
            case 'PAYMENT_SUBMITTED':
              status = 'Pending';  // Changed display text only
              hasUnappliedPayment = true;
              break;
            case 'PAYMENT_PROCESSING':
              status = 'Payment Processing';
              hasUnappliedPayment = true;
              break;
            case 'UNPAID':
            default:
              status = amountRemaining > 0 ? 'Open' : 'Paid';
              break;
          }
          
          // IMPORTANT FIX: Check for unapproved payments even if backend says "PAID"
          // The backend might incorrectly mark an invoice as PAID when there's an unapproved payment
          if (invoice.paymentStatus === 'PAID' && invoice.hasUnappliedPayment) {
            console.log(`Invoice ${invoice.documentNumber} marked as PAID but has unapplied payment - correcting status`);
            status = 'Pending';  // Changed from 'Payment Submitted'
            hasUnappliedPayment = true;
          }
          
          // Also check if there's a matched payment that's unapproved
          if (invoice.matchedPayment) {
            // Check various fields that might indicate unapproved status
            const paymentStatus = invoice.matchedPayment.status || 
                                 invoice.matchedPayment.approvalStatus || 
                                 invoice.matchedPayment.paymentStatus;
            
            if (paymentStatus && 
                (paymentStatus.toLowerCase().includes('unapproved') || 
                 paymentStatus.toLowerCase().includes('pending') ||
                 paymentStatus === 'Unapproved Payment')) {
              console.log(`Invoice ${invoice.documentNumber} has unapproved payment ${invoice.matchedPayment.documentNumber} - setting status to Pending`);
              status = 'Pending';  // Changed from 'Payment Submitted'
              hasUnappliedPayment = true;
              matchedPayment = invoice.matchedPayment;
            }
          }
          
          // Additional check: if amountRemaining > 0 but status is PAID, something's wrong
          if (invoice.paymentStatus === 'PAID' && amountRemaining > 0) {
            console.warn(`Invoice ${invoice.documentNumber} marked as PAID but has remaining balance of ${amountRemaining}`);
            status = 'Open';
          }
        }
        
        // Check payments array for any unapproved payments for this invoice
        if (payments.length > 0 && status === 'Paid') {
          const unapprovedPayment = payments.find(payment => {
            // Ensure payment exists and has required properties
            if (!payment || !payment.appliedTo || !Array.isArray(payment.appliedTo)) {
              return false;
            }
            
            // Check if this payment is applied to this invoice
            const appliedToThisInvoice = payment.appliedTo.some(applied => {
              // Ensure applied object exists
              if (!applied) return false;
              
              return applied.internalId === invoice.internalId || 
                     applied.id === invoice.id ||
                     applied.documentNumber === invoice.documentNumber;
            });
            
            if (appliedToThisInvoice) {
              // Check if payment is unapproved
              const paymentStatus = payment.status || payment.approvalStatus || payment.paymentStatus;
              return paymentStatus && 
                     (paymentStatus.toLowerCase().includes('unapproved') || 
                      paymentStatus.toLowerCase().includes('pending'));
            }
            return false;
          });
          
          if (unapprovedPayment) {
            console.log(`Found unapproved payment ${unapprovedPayment.documentNumber} for invoice ${invoice.documentNumber}`);
            status = 'Pending';  // Changed from 'Payment Submitted'
            hasUnappliedPayment = true;
            matchedPayment = {
              id: unapprovedPayment.id,
              documentNumber: unapprovedPayment.documentNumber,
              amount: unapprovedPayment.amount,
              status: unapprovedPayment.status || unapprovedPayment.approvalStatus
            };
          }
        }
        
        // Calculate due date status
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let isOverdue = false;
        let isPastDue = false;
        
        if (dueDate && status !== 'Paid' && status !== 'Pending' && status !== 'Payment Processing') {  // Updated condition
          const dueDateOnly = new Date(dueDate);
          dueDateOnly.setHours(0, 0, 0, 0);
          
          if (dueDateOnly < today) {
            isOverdue = true;
            isPastDue = true;
          }
        }
        
        return {
          ...invoice,
          // Preserve original fields - ensure we have valid IDs
          id: invoice.id || invoice.internalId || `TEMP-${Date.now()}`,
          internalId: invoice.internalId || invoice.id || `TEMP-${Date.now()}`,
          documentNumber: invoice.documentNumber || invoice.tranid || `INV-${invoice.id || 'UNKNOWN'}`,
          
          // Financial fields
          total: total,
          amountRemaining: amountRemaining,
          amountPaid: total - amountRemaining,
          
          // Status fields
          status: status,
          hasUnappliedPayment: hasUnappliedPayment,
          matchedPayment: matchedPayment,
          isOverdue: isOverdue,
          isPastDue: isPastDue,
          
          // Date fields
          date: invoice.date || invoice.tranDate,
          dueDate: invoice.dueDate,
          
          // Additional fields from matched payment
          unappliedPaymentNumber: matchedPayment?.documentNumber,
          unappliedPaymentAmount: matchedPayment?.unapplied || matchedPayment?.amount,
          
          // Customer info
          customerName: invoice.customerName || invoice.entity?.text || invoice.entity,
          
          // Other fields
          memo: invoice.memo || '',
          subsidiary: invoice.subsidiary,
          billingAddress: invoice.billingAddress
        };
      });
  
      // Filter out any null invoices that might have been created
      const validProcessedInvoices = processedInvoices.filter(invoice => invoice !== null);
  
      // Sort by date (newest first)
      validProcessedInvoices.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
  
      console.log(`Processed ${validProcessedInvoices.length} invoices:`, {
        paid: validProcessedInvoices.filter(i => i.status === 'Paid').length,
        pending: validProcessedInvoices.filter(i => i.status === 'Pending').length,  // Updated from paymentSubmitted
        open: validProcessedInvoices.filter(i => i.status === 'Open').length,
        overdue: validProcessedInvoices.filter(i => i.isOverdue).length
      });
  
      return validProcessedInvoices;
    } catch (error) {
      console.error('Error processing invoices:', error);
      return [];
    }
  };
  
  /**
   * Filter invoices based on selected filter value
   */
  export const filterInvoices = (invoices, filterValue) => {
    if (!invoices || !Array.isArray(invoices)) return [];
    
    return invoices.filter(invoice => {
      if (filterValue === 'unpaid') {
        return invoice.status !== 'Paid' && invoice.status !== 'Pending';  // Updated from 'Payment Submitted'
      } else if (filterValue === 'recent') {
        const invoiceDate = new Date(invoice.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return invoiceDate >= thirtyDaysAgo;
      } else if (filterValue === 'older') {
        const invoiceDate = new Date(invoice.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return invoiceDate < thirtyDaysAgo;
      } else if (filterValue === 'pastYear') {
        const invoiceDate = new Date(invoice.date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return invoiceDate >= oneYearAgo;
      }
      return true;
    });
  };
  
  /**
   * Format currency values
   */
  export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };
  
  /**
   * Format date values
   */
  export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };
  
  /**
   * Get status color classes
   */
  export const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'text-green-700 bg-green-50';
      case 'Pending':  // Updated from 'Payment Submitted'
        return 'text-blue-700 bg-blue-50';
      case 'Payment Processing':
        return 'text-blue-700 bg-blue-50';
      case 'Open':
        return 'text-yellow-700 bg-yellow-50';
      case 'Overdue':
      case 'Past Due':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };
  
  /**
   * Get status icon
   */
  export const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return '✓';
      case 'Pending':  // Updated from 'Payment Submitted'
        return '↻';
      case 'Payment Processing':
        return '↻';
      case 'Open':
        return '○';
      case 'Overdue':
        return '!';
      default:
        return '•';
    }
  };