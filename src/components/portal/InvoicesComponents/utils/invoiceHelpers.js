// Process invoices with payment data
export const processInvoices = (invoicesData, paymentsData) => {
    if (!invoicesData?.invoices) return [];
    
    // Get all unapproved payments
    const unapprovedPayments = paymentsData?.payments?.filter(
      payment => payment.status === 'Unapproved Payment' || payment.status === 'Not Deposited'
    ) || [];
    
    return invoicesData.invoices.map(inv => {
      // Check if this invoice has any unapproved payments
      const hasUnapprovedPayment = unapprovedPayments.some(payment => {
        // Check if payment is applied to this invoice
        return payment.appliedTo?.some(applied => 
          applied.transactionId === inv.internalId || 
          applied.transactionName === inv.documentNumber
        ) || payment.invoiceDetails?.some(detail => 
          detail.transactionName === inv.documentNumber
        );
      });
      
      // Find the unapproved payment for this invoice
      const unapprovedPayment = unapprovedPayments.find(payment => {
        return payment.appliedTo?.some(applied => 
          applied.transactionId === inv.internalId || 
          applied.transactionName === inv.documentNumber
        ) || payment.invoiceDetails?.some(detail => 
          detail.transactionName === inv.documentNumber
        );
      });
      
      return {
        id: inv.documentNumber || inv.id,
        internalId: String(inv.internalId || inv.id),
        date: inv.date,
        description: inv.memo || 'Associate Member',
        amount: parseFloat(inv.total) || 0,
        subtotal: parseFloat(inv.subtotal) || parseFloat(inv.total) || 0,
        taxTotal: parseFloat(inv.taxTotal) || 0,
        discountTotal: parseFloat(inv.discountTotal) || 0,
        amountRemaining: parseFloat(inv.amountRemaining) || 0,
        status: inv.status === 'paidInFull' || parseFloat(inv.amountRemaining) === 0 || inv.status === 'Unapproved Payment' ? 'Paid' : 
                hasUnapprovedPayment ? 'Payment Pending' : 'Unpaid',
        hasUnapprovedPayment,
        unapprovedPaymentNumber: unapprovedPayment?.documentNumber,
        unapprovedPaymentAmount: unapprovedPayment?.amount,
        dueDate: inv.dueDate || inv.date,
        memo: inv.memo || 'Associate Member Dues (Annual)',
        postingPeriod: inv.postingPeriod,
        terms: inv.terms || 'Net 30',
        currency: inv.currency || 'USD',
        subsidiary: inv.subsidiary,
        automaticPayment: inv.automaticPayment || 'ICE AMBASSADOR',
        merchantELink: inv.merchantELink,
        billingAddress: inv.billingAddress,
        _original: inv
      };
    });
  };
  
  // Filter invoices based on selected filter
  export const filterInvoices = (invoices, filterValue) => {
    return invoices.filter(invoice => {
      if (filterValue === 'unpaid') {
        return invoice.status !== 'Paid';
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