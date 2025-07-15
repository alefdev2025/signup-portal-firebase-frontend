import React, { useState, useEffect } from 'react';
import { useInvoices, useCustomerData, usePayments } from './contexts/CustomerDataContext';
import { getInvoiceDetails } from './services/netsuite';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import PortalPaymentPage from '../../pages/PortalPaymentPage';
import jsPDF from 'jspdf';

// Inline SearchableInvoices component with updated styling
const SearchableInvoices = ({ invoices, onInvoiceSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredInvoices = invoices.filter(invoice => 
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search invoices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all text-[#6b5b7e] placeholder-gray-400 text-base h-[50px] border border-[#6b5b7e] focus:border-[#4a4266]"
      />
      {isOpen && searchTerm && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto z-10"
             onMouseLeave={() => setIsOpen(false)}>
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map(invoice => (
              <button
                key={invoice.id}
                onClick={() => {
                  onInvoiceSelect(invoice);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-[#2a2346]">{invoice.id}</div>
                <div className="text-sm text-[#6b7280]">{invoice.description}</div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-[#6b7280]">No invoices found</div>
          )}
        </div>
      )}
    </div>
  );
};

const InvoicesTab = ({ customerId = '4666' }) => {
  const { data: invoicesData, isLoading, error } = useInvoices();
  const { data: paymentsData } = usePayments();
  const { fetchInvoices } = useCustomerData();
  const { salesforceContactId } = useMemberPortal();
  
  const [filterValue, setFilterValue] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [mostRecentBillingAddress, setMostRecentBillingAddress] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  
  // Payment page states
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  
  // Email notification settings
  const [newInvoiceAlerts, setNewInvoiceAlerts] = useState(false);
  const [paymentFailureAlerts, setPaymentFailureAlerts] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [loadingNotificationSettings, setLoadingNotificationSettings] = useState(true);

  // Add Helvetica font with lighter weights
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .invoice-page * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .invoice-page h1,
      .invoice-page h2,
      .invoice-page h3,
      .invoice-page h4 {
        font-weight: 400 !important;
      }
      .invoice-page .font-medium {
        font-weight: 400 !important;
      }
      .invoice-page .font-semibold {
        font-weight: 500 !important;
      }
      .invoice-page .font-bold {
        font-weight: 500 !important;
      }
      .invoice-page p,
      .invoice-page span,
      .invoice-page div {
        font-weight: 300 !important;
      }
      .invoice-page .text-xs {
        font-weight: 400 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.invoiceView === 'list') {
        setSelectedInvoice(null);
        setShowPaymentPage(false);
        setInvoiceForPayment(null);
        // Scroll to top after state changes
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          // Also try to find and scroll any parent containers
          const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
          containers.forEach(container => {
            if (container) container.scrollTop = 0;
          });
        });
      } else if (event.state && event.state.invoiceView === 'detail') {
        // If we have invoice data in state, we could restore it
        // For now, just go back to list
        setSelectedInvoice(null);
        setShowPaymentPage(false);
        setInvoiceForPayment(null);
        // Scroll to top after state changes
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          // Also try to find and scroll any parent containers
          const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
          containers.forEach(container => {
            if (container) container.scrollTop = 0;
          });
        });
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial state for the list view
    if (!window.history.state || !window.history.state.invoiceView) {
      window.history.replaceState({ invoiceView: 'list' }, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Fetch notification settings from backend
  const fetchNotificationSettings = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/invoice-notifications/${customerId}`);
      // const data = await response.json();
      
      // For now, use the customer email from customerInfo or salesforce data
      const mockData = {
        newInvoiceAlerts: false,
        paymentFailureAlerts: false,
        notificationEmail: customerInfo?.email || 'member@alcor.org' // Will be updated when customerInfo loads
      };
      
      setNewInvoiceAlerts(mockData.newInvoiceAlerts);
      setPaymentFailureAlerts(mockData.paymentFailureAlerts);
      setNotificationEmail(mockData.notificationEmail);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoadingNotificationSettings(false);
    }
  };
  
  // Fetch notification settings on mount and when customerInfo changes
  useEffect(() => {
    fetchNotificationSettings();
  }, [customerInfo]);
  
  // Handle notification toggle changes
  const handleNotificationToggle = async (type, value) => {
    try {
      // Update state immediately for better UX
      if (type === 'newInvoice') {
        setNewInvoiceAlerts(value);
      } else if (type === 'paymentFailure') {
        setPaymentFailureAlerts(value);
      }
      
      // TODO: Replace with actual API call
      // await fetch(`/api/invoice-notifications/${customerId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type,
      //     enabled: value
      //   })
      // });
      
      console.log(`Updated ${type} notification setting to:`, value);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      if (type === 'newInvoice') {
        setNewInvoiceAlerts(!value);
      } else if (type === 'paymentFailure') {
        setPaymentFailureAlerts(!value);
      }
    }
  };

  // Process invoices when data changes
  const invoices = React.useMemo(() => {
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
  }, [invoicesData, paymentsData]);

  // Fetch billing address from most recent invoice
  useEffect(() => {
    if (invoices.length > 0 && !mostRecentBillingAddress) {
      // Sort by date to get most recent
      const sortedByDate = [...invoices].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      // Try to fetch billing address from the most recent invoice
      const mostRecent = sortedByDate[0];
      if (mostRecent.internalId) {
        getInvoiceDetails(mostRecent.internalId)
          .then(details => {
            if (details.invoice && details.invoice.billingAddress) {
              setMostRecentBillingAddress(details.invoice.billingAddress);
              console.log('Fetched billing address from invoice:', mostRecent.id);
            }
          })
          .catch(err => {
            console.warn('Could not fetch billing address from most recent invoice:', err.message);
          });
      }
    }
  }, [invoices, mostRecentBillingAddress]);

  // Fetch customer information from Salesforce
  useEffect(() => {
    if (salesforceContactId && !customerInfo) {
      getMemberProfile(salesforceContactId)
        .then(result => {
          if (result.success && result.data) {
            const profileData = result.data.data || result.data;
            const info = {
              name: `${profileData.personalInfo?.firstName || ''} ${profileData.personalInfo?.lastName || ''}`.trim(),
              alcorId: profileData.personalInfo?.alcorId || 'N/A',
              subsidiary: profileData.personalInfo?.subsidiary || invoices[0]?.subsidiary || 'Alcor Life Extension Foundation',
              email: profileData.personalInfo?.email || profileData.contactInfo?.email || ''
            };
            setCustomerInfo(info);
            // Update notification email if we have one
            if (info.email) {
              setNotificationEmail(info.email);
            }
          }
        })
        .catch(err => {
          console.error('Error fetching customer info:', err);
        });
    }
  }, [salesforceContactId, customerInfo, invoices]);

  // Handle viewing invoice details
  const handleViewInvoice = async (invoice) => {
    setLoadingInvoiceId(invoice.id);
    window.scrollTo(0, 0);
    
    // Push new history state for the detail view
    window.history.pushState(
      { invoiceView: 'detail', invoiceId: invoice.id }, 
      '', 
      window.location.href
    );
    
    try {
      // If we have an internal ID, try to fetch more details
      if (invoice.internalId) {
        const details = await getInvoiceDetails(invoice.internalId);
        setSelectedInvoice({
          ...invoice,
          ...details.invoice,
          detailedInfo: details.invoice,
          billingAddress: details.invoice.billingAddress || invoice.billingAddress,
          // Preserve the payment pending status from the list
          status: invoice.status,
          hasUnapprovedPayment: invoice.hasUnapprovedPayment,
          unapprovedPaymentNumber: invoice.unapprovedPaymentNumber,
          unapprovedPaymentAmount: invoice.unapprovedPaymentAmount
        });
      } else {
        setSelectedInvoice(invoice);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      // Just show what we have
      setSelectedInvoice(invoice);
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = async (invoice) => {
    try {
      // Create a hidden iframe for printing
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-10000px';
      document.body.appendChild(printFrame);

      const printDocument = printFrame.contentDocument || printFrame.contentWindow.document;
      
      // Get current date/time for timestamp
      const printDate = new Date();
      const timestamp = printDate.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Create the invoice HTML content
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.id}</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #2a2346;
                margin: 0;
                padding: 20px;
              }
              .invoice-header {
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .invoice-title {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #2a2346;
              }
              .invoice-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
              }
              .invoice-meta-item {
                font-size: 14px;
                color: #6b7280;
              }
              .invoice-meta-item strong {
                color: #2a2346;
              }
              .status-badge {
                display: inline-block;
                padding: 6px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
              }
              .status-paid {
                background-color: #e5d4f1;
                color: #6b5b7e;
              }
              .status-pending {
                background-color: #dbeafe;
                color: #1e40af;
              }
              .status-unpaid {
                background-color: #fef3e2;
                color: #d09163;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 15px;
                color: #2a2346;
              }
              .info-box {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 15px;
              }
              .info-box p {
                margin: 0;
                padding: 2px 0;
                font-size: 14px;
              }
              .info-box .name {
                font-weight: 500;
                font-size: 16px;
                color: #2a2346;
                margin-bottom: 8px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th {
                background-color: #f9fafb;
                padding: 12px;
                text-align: left;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
                color: #6b7280;
                border-bottom: 1px solid #e5e7eb;
              }
              td {
                padding: 16px 12px;
                font-size: 14px;
                border-bottom: 1px solid #e5e7eb;
              }
              th:last-child, td:last-child {
                text-align: right;
              }
              th:nth-child(2), td:nth-child(2) {
                text-align: center;
              }
              th:nth-child(3), td:nth-child(3) {
                text-align: right;
              }
              .summary-box {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin-left: auto;
                width: 300px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
              }
              .summary-row.total {
                border-top: 1px solid #e5e7eb;
                padding-top: 10px;
                font-weight: 600;
                font-size: 16px;
              }
              .summary-row.amount-due {
                color: #d09163;
                font-weight: 600;
              }
              .footer-note {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .print-timestamp {
                text-align: right;
                color: #6b7280;
                font-size: 12px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="print-timestamp">
              Printed on: ${timestamp}
            </div>
            <div class="invoice-header">
              <h1 class="invoice-title">Invoice ${invoice.id}</h1>
              <div class="invoice-meta">
                <div>
                  <div class="invoice-meta-item"><strong>Invoice Date:</strong> ${new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div class="invoice-meta-item"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div>
                  <span class="status-badge ${
                    invoice.status === 'Paid' ? 'status-paid' : 
                    invoice.status === 'Payment Pending' ? 'status-pending' :
                    'status-unpaid'
                  }">
                    ${invoice.status === 'Paid' ? 'Paid' : 
                      invoice.status === 'Payment Pending' ? 'Payment Pending' :
                      'Payment Due'}
                  </span>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Customer Information</h2>
              <div class="info-box">
                <p class="name">${customerInfo?.name || 'Customer Name'}</p>
                <p>Alcor ID: ${customerInfo?.alcorId || invoice.id}</p>
                <p>${invoice.subsidiary}</p>
              </div>
            </div>

            ${invoice.billingAddress ? `
              <div class="section">
                <h2 class="section-title">Billing Address</h2>
                <div class="info-box">
                  <p class="name">${invoice.billingAddress.addressee}</p>
                  <p>${invoice.billingAddress.addr1}</p>
                  ${invoice.billingAddress.addr2 ? `<p>${invoice.billingAddress.addr2}</p>` : ''}
                  <p>${invoice.billingAddress.city}, ${invoice.billingAddress.state} ${invoice.billingAddress.zip}</p>
                  <p>${invoice.billingAddress.country || 'United States'}</p>
                </div>
              </div>
            ` : ''}

            <div class="section">
              <h2 class="section-title">Invoice Items</h2>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items && invoice.items.length > 0 ? invoice.items.map(item => `
                    <tr>
                      <td>${item.description || invoice.description}</td>
                      <td>${item.quantity || 1}</td>
                      <td>${(item.rate || invoice.amount).toFixed(2)}</td>
                      <td>${(item.amount || invoice.amount).toFixed(2)}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td>${invoice.description}</td>
                      <td>1</td>
                      <td>${invoice.amount.toFixed(2)}</td>
                      <td>${invoice.amount.toFixed(2)}</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                ${invoice.discountTotal > 0 ? `
                  <div class="summary-row">
                    <span>Discount</span>
                    <span>-${invoice.discountTotal.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="summary-row">
                  <span>Tax</span>
                  <span>${invoice.taxTotal.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                  <span>Total</span>
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
                ${invoice.status !== 'Paid' ? `
                  <div class="summary-row amount-due">
                    <span>Amount Due</span>
                    <span>${invoice.amountRemaining.toFixed(2)}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="footer-note">
              <p>Thank you for your membership!</p>
              <p>Alcor Life Extension Foundation</p>
            </div>
          </body>
        </html>
      `;

      printDocument.open();
      printDocument.write(invoiceHTML);
      printDocument.close();

      // Wait for content to load then print
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        // Remove the iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 250);

    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error printing invoice. Please try again later.');
    }
  };

// Then replace the handleDownloadInvoice function with this:
const handleDownloadInvoice = async (invoice) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;  // Reduced from 25 to start content more to the left
    const rightMargin = pageWidth - margin;
    const contentWidth = pageWidth - (margin * 2);
    
    // Get current date/time for timestamp
    const downloadDate = new Date();
    const timestamp = downloadDate.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Add timestamp at top right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${timestamp}`, rightMargin, 10, { align: 'right' });
    
    // Add ALCOR header info - START HIGHER
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ALCOR LIFE EXTENSION FOUNDATION', rightMargin, 20, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('7895 E. Acoma Dr. #110, Scottsdale, AZ 85260-6916', rightMargin, 25, { align: 'right' });
    doc.text('480-905-1906 • Fax 480-922-9027 • www.alcor.org', rightMargin, 30, { align: 'right' });
    
    // Invoice Title and Status - MOVED UP
    doc.setFontSize(20);  // Smaller font size
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice ${invoice.id}`, margin, 45);  // Moved down for more space
    
    // Status Badge
    const statusText = invoice.status === 'Paid' ? 'Paid' : 
                      invoice.status === 'Payment Pending' ? 'Payment Pending' :
                      'Payment Due';
    const statusWidth = invoice.status === 'Payment Pending' ? 55 : 45;  // Wider for Payment Pending
    const statusHeight = 10;
    const statusX = rightMargin - statusWidth;
    const statusY = 37;  // Adjusted position
    
    // Status background
    if (invoice.status === 'Paid') {
      doc.setFillColor(229, 212, 241); // Light purple
      doc.setTextColor(107, 91, 126); // Purple text
    } else if (invoice.status === 'Payment Pending') {
      doc.setFillColor(219, 234, 254); // Light blue
      doc.setTextColor(30, 64, 175); // Blue text
    } else {
      doc.setFillColor(254, 243, 226); // Light orange
      doc.setTextColor(208, 145, 99); // Orange text
    }
    
    // Draw rectangle (jsPDF doesn't have built-in rounded corners for basic version)
    doc.rect(statusX, statusY, statusWidth, statusHeight, 'F');
    
    // Add subtle border for rounded corner effect
    if (invoice.status === 'Paid') {
      doc.setDrawColor(229, 212, 241);
    } else if (invoice.status === 'Payment Pending') {
      doc.setDrawColor(219, 234, 254);
    } else {
      doc.setDrawColor(254, 243, 226);
    }
    doc.setLineWidth(0.5);
    doc.rect(statusX - 0.5, statusY - 0.5, statusWidth + 1, statusHeight + 1);
    
    // Status text - properly centered
    doc.setFontSize(10);
    doc.text(statusText, statusX + (statusWidth / 2), statusY + (statusHeight / 2) + 1.5, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Invoice metadata - COMPACT SPACING
    let yPos = 57;  // More space below header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    // Invoice Date
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 35, yPos);
    
    // Due Date - same line
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', margin + 90, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 120, yPos);
    
    // Customer Information Section
    yPos = 72;  // Adjusted for more space
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Customer Information', margin, yPos);
    
    // Customer info box
    yPos += 10;
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 32, 'F');
    
    // Customer details
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(customerInfo?.name || 'Customer Name', margin + 5, yPos + 10);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Alcor ID: ${customerInfo?.alcorId || invoice.id}`, margin + 5, yPos + 18);
    doc.text(customerInfo?.subsidiary || invoice.subsidiary || 'Alcor Life Extension Foundation', margin + 5, yPos + 26);
    
    // Billing Address Section
    if (invoice.billingAddress) {
      yPos += 40;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Billing Address', margin, yPos);
      
      yPos += 10;
      doc.setFillColor(249, 250, 251);
      const addressLines = 3 + (invoice.billingAddress.addr2 ? 1 : 0);
      const addressHeight = 15 + (addressLines * 6);
      doc.rect(margin, yPos, contentWidth, addressHeight, 'F');
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.billingAddress.addressee, margin + 5, yPos + 10);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      let addressY = yPos + 18;
      doc.text(invoice.billingAddress.addr1, margin + 5, addressY);
      if (invoice.billingAddress.addr2) {
        addressY += 6;
        doc.text(invoice.billingAddress.addr2, margin + 5, addressY);
      }
      addressY += 6;
      doc.text(`${invoice.billingAddress.city}, ${invoice.billingAddress.state} ${invoice.billingAddress.zip}`, margin + 5, addressY);
      addressY += 6;
      doc.text(invoice.billingAddress.country || 'United States', margin + 5, addressY);
      
      yPos += addressHeight;
    }
    
    // Invoice Items Section
    yPos += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Invoice Items', margin, yPos);
    
    // Table
    yPos += 10;
    
    // Table header
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    
    // Draw table border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, 10);
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text('DESCRIPTION', margin + 5, yPos + 7);
    doc.text('QUANTITY', margin + 90, yPos + 7, { align: 'center' });
    doc.text('RATE', rightMargin - 50, yPos + 7, { align: 'right' });
    doc.text('AMOUNT', rightMargin - 5, yPos + 7, { align: 'right' });
    
    // Table rows
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const items = invoice.items && invoice.items.length > 0 ? invoice.items : [{
      description: invoice.description || 'Dues : Dues Associate Member',
      quantity: 1,
      rate: invoice.amount,
      amount: invoice.amount
    }];
    
    items.forEach((item) => {
      // Draw row border
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, yPos, contentWidth, 12);
      
      yPos += 8;
      doc.text(item.description || invoice.description, margin + 5, yPos);
      doc.text((item.quantity || 1).toString(), margin + 90, yPos, { align: 'center' });
      doc.text(`${(item.rate || invoice.amount).toFixed(2)}`, rightMargin - 50, yPos, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`${(item.amount || invoice.amount).toFixed(2)}`, rightMargin - 5, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 4;
    });
    
    // Check if we need a new page for summary
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 30;
    }
    
    // Summary Section
    yPos += 15;
    const summaryX = rightMargin - 80;
    
    // Summary items
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    // Subtotal
    doc.text('Subtotal', summaryX, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(`${invoice.subtotal.toFixed(2)}`, rightMargin - 5, yPos, { align: 'right' });
    
    // Discount (if any)
    if (invoice.discountTotal > 0) {
      yPos += 8;
      doc.setTextColor(100, 100, 100);
      doc.text('Discount', summaryX, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(`-${invoice.discountTotal.toFixed(2)}`, rightMargin - 5, yPos, { align: 'right' });
    }
    
    // Tax
    yPos += 8;
    doc.setTextColor(100, 100, 100);
    doc.text('Tax', summaryX, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(`${invoice.taxTotal.toFixed(2)}`, rightMargin - 5, yPos, { align: 'right' });
    
    // Total line
    yPos += 6;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(summaryX - 10, yPos, rightMargin - 5, yPos);
    
    // Total
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', summaryX, yPos);
    doc.text(`${invoice.amount.toFixed(2)}`, rightMargin - 5, yPos, { align: 'right' });
    
    // Amount Due - only show if not paid
    if (invoice.status !== 'Paid') {
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(208, 145, 99); // Orange
      doc.text('Amount Due', summaryX, yPos);
      doc.text(`${invoice.amountRemaining.toFixed(2)}`, rightMargin - 5, yPos, { align: 'right' });
    }
    
    // Footer - only add if there's space
    if (yPos < pageHeight - 50) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for your membership!', pageWidth / 2, pageHeight - 35, { align: 'center' });
      doc.text('Alcor Life Extension Foundation', pageWidth / 2, pageHeight - 28, { align: 'center' });
    }
    
    // Save the PDF with timestamp in filename
    const dateStr = downloadDate.toISOString().split('T')[0];
    doc.save(`Invoice_${invoice.id}_${dateStr}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again later.');
  }
};

  // Handle closing invoice detail view
  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
    // Use requestAnimationFrame to ensure DOM updates before scrolling
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // Also try to find and scroll any parent containers
      const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
      containers.forEach(container => {
        if (container) container.scrollTop = 0;
      });
    });
  };

  // Handle payment action - Updated to show payment page
  const handlePayInvoice = (invoice) => {
    // Ensure we have all the necessary invoice details
    const invoiceWithDetails = {
      ...invoice,
      billingAddress: invoice.billingAddress || mostRecentBillingAddress
    };
    
    // Push new history state for the payment view
    window.history.pushState(
      { invoiceView: 'payment', invoiceId: invoice.id }, 
      '', 
      window.location.href
    );
    
    setInvoiceForPayment(invoiceWithDetails);
    setShowPaymentPage(true);
    
    // Force scroll to top after state update
    setTimeout(() => {
      // Try multiple approaches to find the scroll container
      const scrollableElements = [
        document.documentElement,
        document.body,
        document.querySelector('.bg-gray-50'),
        document.querySelector('[class*="overflow"]'),
        document.querySelector('[class*="scroll"]'),
        document.querySelector('main'),
        document.querySelector('#root')
      ].filter(Boolean);
      
      scrollableElements.forEach(el => {
        if (el) {
          el.scrollTop = 0;
          el.scrollTo && el.scrollTo(0, 0);
        }
      });
      
      // Also try window scroll
      window.scrollTo(0, 0);
    }, 0);
  };

  // Handle back from payment page
  const handleBackFromPayment = () => {
    setShowPaymentPage(false);
    setInvoiceForPayment(null);
    // Always clear selected invoice to go back to list view
    setSelectedInvoice(null);
    // Refresh invoices to show updated payment status
    fetchInvoices({ forceRefresh: true });
    window.scrollTo(0, 0);
  };

  // Filter invoices based on selected filter
  const filteredInvoices = invoices.filter(invoice => {
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

  // Handle refresh
  const handleRefresh = async () => {
    await fetchInvoices({ forceRefresh: true });
  };

  // Loading state
  if (isLoading && !invoices.length) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading invoices...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invoices.length) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="h-8"></div>
        <div className="px-4 md:px-0">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            <p className="font-bold">Error loading invoices</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show payment page if active
  if (showPaymentPage && invoiceForPayment) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <PortalPaymentPage 
          invoice={invoiceForPayment} 
          onBack={handleBackFromPayment}
        />
      </div>
    );
  }

  return (
    <div className="invoice-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Show banner if refreshing in background */}
      {isLoading && invoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2 mx-4 md:mx-0">
          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-blue-700">Checking for new invoices...</span>
        </div>
      )}

      {/* Full Invoice View */}
      {selectedInvoice ? (
        <div className="animate-fadeIn">
          <div className="px-4 sm:px-4 md:px-0">
            <div className="bg-white rounded-lg shadow-[0_-2px_10px_rgba(0,0,0,0.08),0_4px_15px_rgba(0,0,0,0.1)] animate-fadeInUp">
              {/* Invoice Details */}
              <div className="p-5 sm:p-6 lg:p-8">
              {/* Invoice Header Information */}
              <div className="mb-6 lg:mb-10 mt-1 lg:mt-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-4 lg:pb-8 border-b border-gray-200">
                  <div className="mb-3 sm:mb-0">
                    <h2 className="text-lg lg:text-2xl font-semibold text-[#2a2346] mb-3 lg:mb-6 mt-1 animate-fadeIn">Invoice {selectedInvoice.id}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 lg:gap-x-8 gap-y-1.5 lg:gap-y-3 text-xs lg:text-base text-[#6b7280] animate-fadeIn animation-delay-100">
                      <div>
                        <span className="font-medium">Invoice Date:</span>
                        <span className="ml-1 lg:ml-3 block sm:inline">{new Date(selectedInvoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <span className="ml-1 lg:ml-3 block sm:inline">{new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`self-start px-2.5 lg:px-4 py-1 lg:py-2 text-xs lg:text-base font-medium rounded-lg mt-3 sm:mt-2 animate-fadeIn animation-delay-200 ${
                    selectedInvoice.status === 'Paid' 
                      ? 'bg-[#e5d4f1] text-black' 
                      : selectedInvoice.status === 'Payment Pending'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-[#fef3e2] text-black'
                  }`}>
                    {selectedInvoice.status === 'Paid' ? 'Paid' : 
                     selectedInvoice.status === 'Payment Pending' ? 'Payment Pending' :
                     'Payment Due'}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="mb-6 lg:mb-10 animate-fadeIn animation-delay-300">
                <h3 className="text-sm lg:text-lg font-semibold text-[#2a2346] mb-3 lg:mb-4">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                  <p className="text-[#2a2346] font-medium text-sm lg:text-lg mb-1.5">{customerInfo?.name || 'Loading...'}</p>
                  <p className="text-[#6b7280] text-xs lg:text-base">Alcor ID: {customerInfo?.alcorId || 'Loading...'}</p>
                  <p className="text-[#6b7280] text-xs lg:text-base">{customerInfo?.subsidiary || selectedInvoice.subsidiary}</p>
                </div>
              </div>

              {/* Billing Address */}
              {selectedInvoice.billingAddress && (
                <div className="mb-6 lg:mb-10 animate-fadeIn animation-delay-350">
                  <h3 className="text-sm lg:text-lg font-semibold text-[#2a2346] mb-3 lg:mb-4">Billing Address</h3>
                  <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                    <p className="text-[#2a2346] font-medium text-sm lg:text-lg mb-1.5">
                      {selectedInvoice.billingAddress.addressee}
                    </p>
                    <p className="text-[#6b7280] text-xs lg:text-base">{selectedInvoice.billingAddress.addr1}</p>
                    {selectedInvoice.billingAddress.addr2 && (
                      <p className="text-[#6b7280] text-xs lg:text-base">{selectedInvoice.billingAddress.addr2}</p>
                    )}
                    <p className="text-[#6b7280] text-xs lg:text-base">
                      {selectedInvoice.billingAddress.city}, {selectedInvoice.billingAddress.state} {selectedInvoice.billingAddress.zip}
                    </p>
                    <p className="text-[#6b7280] text-xs lg:text-base">{selectedInvoice.billingAddress.country || 'United States'}</p>
                  </div>
                </div>
              )}

              {/* Invoice Items */}
              <div className="mb-6 lg:mb-10 animate-fadeIn animation-delay-400">
                <h3 className="text-sm lg:text-lg font-semibold text-[#2a2346] mb-3 lg:mb-4">Invoice Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Description</th>
                        <th className="text-center px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Qty</th>
                        <th className="text-right px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Rate</th>
                        <th className="text-right px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346]">{item.description || selectedInvoice.description}</td>
                            <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-center">{item.quantity || 1}</td>
                            <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-right">${(item.rate || selectedInvoice.amount).toFixed(2)}</td>
                            <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] font-medium text-right">${(item.amount || selectedInvoice.amount).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346]">{selectedInvoice.description}</td>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-center">1</td>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-right">${selectedInvoice.amount.toFixed(2)}</td>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] font-medium text-right">${selectedInvoice.amount.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="flex justify-end mb-6 lg:mb-10 animate-fadeIn animation-delay-500">
                <div className="w-full sm:w-72 lg:w-96 max-w-[280px] sm:max-w-none">
                  <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                    <div className="flex justify-between items-center mb-1.5 lg:mb-3">
                      <span className="text-xs lg:text-base text-[#6b7280]">Subtotal</span>
                      <span className="text-xs lg:text-base text-[#2a2346] font-medium">${selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.discountTotal > 0 && (
                      <div className="flex justify-between items-center mb-1.5 lg:mb-3">
                        <span className="text-xs lg:text-base text-[#6b7280]">Discount</span>
                        <span className="text-xs lg:text-base text-[#2a2346] font-medium">-${selectedInvoice.discountTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-1.5 lg:mb-3">
                      <span className="text-xs lg:text-base text-[#6b7280]">Tax</span>
                      <span className="text-xs lg:text-base text-[#2a2346] font-medium">${selectedInvoice.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm lg:text-lg font-semibold text-[#2a2346]">Total</span>
                        <span className="text-lg lg:text-2xl font-semibold text-[#2a2346]">${selectedInvoice.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-xs lg:text-base text-[#6b7280]">Amount Due</span>
                        <span className="text-base lg:text-xl font-semibold text-[#d09163]">
                          ${selectedInvoice.amountRemaining.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center border-t pt-12 pb-4 animate-fadeIn animation-delay-700">
                <button 
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:bg-[#6b5b7e] hover:text-white transition-all text-xs w-full sm:w-40"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button 
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:bg-[#6b5b7e] hover:text-white transition-all text-xs w-full sm:w-40"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                {selectedInvoice.status !== 'Paid' && selectedInvoice.status !== 'Payment Pending' && (
                  <button 
                    onClick={() => handlePayInvoice(selectedInvoice)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#6c4674] text-white rounded-lg hover:bg-[#5a4862] transition-colors font-medium text-xs w-full sm:w-40"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Pay Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Back button - moved to bottom */}
          <button 
            onClick={handleCloseInvoice}
            className="flex items-center gap-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors mt-6 mb-8 text-sm lg:text-lg animate-fadeInUp mx-4 md:mx-0"
          >
            <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoices
          </button>
        </div>
        </div>
      ) : (
        <div className="px-4 md:px-0">
        
        <div className="bg-white rounded-2xl border border-gray-200 p-10 mb-8 animate-fadeIn animation-delay-100" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900">Invoice History</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="w-full sm:w-80">
                <SearchableInvoices 
                  invoices={invoices} 
                  onInvoiceSelect={handleViewInvoice}
                />
              </div>
              <select 
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full sm:w-auto px-5 pr-10 py-3 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-base h-[50px] border border-[#6b5b7e] focus:border-[#4a4266]"
              >
                <option value="all">All Invoices</option>
                <option value="unpaid">Unpaid Only</option>
                <option value="recent">Last 30 Days</option>
                <option value="older">Older than 30 Days</option>
                <option value="pastYear">Past Year</option>
              </select>
            </div>
          </div>

            <div className="space-y-4">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice, index) => (
                  <div key={invoice.id} className="relative p-6 pl-10 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all animate-fadeInUp" style={{animationDelay: `${300 + index * 100}ms`}}>
                    {/* Vertical line - on the edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#785683] rounded-l-lg"></div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between sm:justify-start sm:items-center gap-4 mb-3">
                          <h3 className="text-base font-semibold text-gray-900">{invoice.id}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                            invoice.status === 'Paid' 
                              ? 'bg-[#e5d4f1] text-[#6b5b7e]' 
                              : invoice.status === 'Payment Pending'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-[#fef3e2] text-[#d09163]'
                          }`}>
                            {invoice.status === 'Paid' ? 'Paid' : 
                             invoice.status === 'Payment Pending' ? `Payment Pending #${invoice.unapprovedPaymentNumber}` :
                             'Payment Due'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 font-light">{invoice.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 font-light">
                          <span>{new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span>Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xl font-semibold text-gray-900">${invoice.amount.toFixed(2)}</p>
                          {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.amount && (
                            <p className="text-xs text-orange-600 mt-1 font-medium">Due: ${invoice.amountRemaining.toFixed(2)}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => handleViewInvoice(invoice)}
                          disabled={loadingInvoiceId === invoice.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-light text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed w-[80px] h-[32px] justify-center"
                        >
                          {loadingInvoiceId === invoice.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <>
                              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 animate-fadeIn">
                  <p className="text-[#4a3d6b] text-lg">No invoices found matching your filter.</p>
                  <button 
                    onClick={() => setFilterValue('all')}
                    className="mt-3 text-base text-[#6b5b7e] hover:text-[#4a4266] transition-colors underline"
                  >
                    Show all invoices
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-fadeIn animation-delay-500" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg relative overflow-hidden" style={{ 
                  background: 'linear-gradient(135deg, #4a5578 0%, #3e466d 50%, #485387 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)'
                }}>
                  <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-10"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Invoice Summary</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-500 text-sm font-light">Total Invoices</span>
                  <span className="font-semibold text-gray-900 text-lg">{invoices.length}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-500 text-sm font-light">Paid Invoices</span>
                  <span className="font-semibold text-purple-700 text-lg">{invoices.filter(i => i.status === 'Paid').length}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-500 text-sm font-light">Total Due</span>
                  <span className="font-semibold text-orange-600 text-lg">
                    ${invoices.reduce((sum, inv) => sum + inv.amountRemaining, 0).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-base text-[#4a3d6b] font-light italic text-center">
                    Reminder: Your Membership Dues are Tax Deductible
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-fadeIn animation-delay-600" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg relative overflow-hidden" style={{ 
                  background: 'linear-gradient(135deg, #4a5578 0%, #3e466d 50%, #485387 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)'
                }}>
                  <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-10"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Billing Information</h3>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              ) : mostRecentBillingAddress ? (
                <div className="space-y-3 text-base">
                  <p className="text-gray-900 font-medium text-lg">
                    {mostRecentBillingAddress.addressee}
                  </p>
                  <p className="text-gray-600 font-light">{mostRecentBillingAddress.addr1}</p>
                  {mostRecentBillingAddress.addr2 && (
                    <p className="text-gray-600 font-light">{mostRecentBillingAddress.addr2}</p>
                  )}
                  <p className="text-gray-600 font-light">
                    {mostRecentBillingAddress.city}, {mostRecentBillingAddress.state} {mostRecentBillingAddress.zip}
                  </p>
                  <p className="text-gray-600 font-light">{mostRecentBillingAddress.country || 'United States'}</p>
                  <p className="text-xs text-[#6b7280] mt-3 italic">
                    From most recent invoice
                  </p>
                </div>
              ) : (
                <div className="text-[#6b7280] text-base">
                  <p>No billing address available</p>
                  <p className="text-sm mt-2">Billing address will appear here once an invoice is created.</p>
                </div>
              )}
            </div>
          </div>

          {/* Email Notifications Section - Moved to bottom */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mt-10 mb-16 animate-fadeIn animation-delay-700" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
            <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Notifications</h3>
                <p className="text-sm lg:text-base text-gray-500 font-light">Get notified when new invoices are available</p>
              </div>
              
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-8 sm:items-center">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={newInvoiceAlerts}
                        onChange={(e) => handleNotificationToggle('newInvoice', e.target.checked)}
                        disabled={loadingNotificationSettings}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                    </div>
                    <span className="text-sm lg:text-base text-gray-500 font-light">New invoice alerts</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={paymentFailureAlerts}
                        onChange={(e) => handleNotificationToggle('paymentFailure', e.target.checked)}
                        disabled={loadingNotificationSettings}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                    </div>
                    <span className="text-sm lg:text-base text-gray-500 font-light">Payment failures</span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm lg:text-base text-gray-500 font-light">Sending to:</p>
                      {loadingNotificationSettings ? (
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mt-1"></div>
                      ) : (
                        <p className="font-medium text-gray-900 text-sm lg:text-base break-all">{notificationEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          </div>
      )}
    </div>
  );
};

export default InvoicesTab;