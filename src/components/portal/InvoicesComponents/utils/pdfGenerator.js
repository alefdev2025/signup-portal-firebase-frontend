import jsPDF from 'jspdf';

export const handlePrintInvoice = async (invoice, customerInfo) => {
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

export const handleDownloadInvoice = async (invoice, customerInfo) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
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
    
    // Add ALCOR header info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ALCOR LIFE EXTENSION FOUNDATION', rightMargin, 20, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('7895 E. Acoma Dr. #110, Scottsdale, AZ 85260-6916', rightMargin, 25, { align: 'right' });
    doc.text('480-905-1906 • Fax 480-922-9027 • www.alcor.org', rightMargin, 30, { align: 'right' });
    
    // Invoice Title and Status
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice ${invoice.id}`, margin, 45);
    
    // Status Badge
    const statusText = invoice.status === 'Paid' ? 'Paid' : 
                      invoice.status === 'Payment Pending' ? 'Payment Pending' :
                      'Payment Due';
    const statusWidth = invoice.status === 'Payment Pending' ? 55 : 45;
    const statusHeight = 10;
    const statusX = rightMargin - statusWidth;
    const statusY = 37;
    
    // Status background
    if (invoice.status === 'Paid') {
      doc.setFillColor(229, 212, 241);
      doc.setTextColor(107, 91, 126);
    } else if (invoice.status === 'Payment Pending') {
      doc.setFillColor(219, 234, 254);
      doc.setTextColor(30, 64, 175);
    } else {
      doc.setFillColor(254, 243, 226);
      doc.setTextColor(208, 145, 99);
    }
    
    doc.rect(statusX, statusY, statusWidth, statusHeight, 'F');
    
    // Add subtle border
    if (invoice.status === 'Paid') {
      doc.setDrawColor(229, 212, 241);
    } else if (invoice.status === 'Payment Pending') {
      doc.setDrawColor(219, 234, 254);
    } else {
      doc.setDrawColor(254, 243, 226);
    }
    doc.setLineWidth(0.5);
    doc.rect(statusX - 0.5, statusY - 0.5, statusWidth + 1, statusHeight + 1);
    
    // Status text
    doc.setFontSize(10);
    doc.text(statusText, statusX + (statusWidth / 2), statusY + (statusHeight / 2) + 1.5, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Invoice metadata
    let yPos = 57;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    // Invoice Date
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 35, yPos);
    
    // Due Date
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', margin + 90, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 120, yPos);
    
    // Customer Information Section
    yPos = 72;
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
      doc.setTextColor(208, 145, 99);
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