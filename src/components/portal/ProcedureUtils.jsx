import jsPDF from 'jspdf';

export const generateProcedurePDF = (formData) => {
  const doc = new jsPDF();
  
  // Add Portal Submission info in top left - MOVED UP
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Portal Submission', 20, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(dateStr, 20, 23);
  
  // TODO: Add ALCOR logo
  // To add the logo, you need to convert it to base64 first
  // Then use: doc.addImage(base64String, 'PNG', 20, 5, 40, 15);
  
  // Add ALCOR company info in top right - MOVED UP
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ALCOR LIFE EXTENSION FOUNDATION', 200, 10, { align: 'right' });
  
  // Add company address info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('7895 E. Acoma Dr. #110, Scottsdale, AZ 85260-6916', 200, 15, { align: 'right' });
  doc.text('480-905-1906 • Fax 480-922-9027 • www.alcor.org', 200, 19, { align: 'right' });
  
  // Add tagline in italics
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('The World Leader in Cryonics • Est. 1972', 200, 23, { align: 'right' });
  
  // Reset font
  doc.setFont('helvetica', 'normal');
  
  // Add title - CLOSER TO TOP
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMBER INFORMATION', 105, 40, { align: 'center' });
  
  // Initialize variables - VERY TIGHT SPACING
  let yPos = 48; // Start much higher
  const lineHeight = 7; // Very tight line height
  const leftMargin = 20;
  const rightMargin = 190;
  const labelWidth = 50; // Slightly wider for labels
  
  // Helper function to draw table rows - CONDENSED
  const drawTableRow = (label, value, height = lineHeight) => {
    // Draw the row
    doc.line(leftMargin, yPos, rightMargin, yPos);
    doc.line(leftMargin, yPos, leftMargin, yPos + height);
    doc.line(leftMargin + labelWidth, yPos, leftMargin + labelWidth, yPos + height);
    doc.line(rightMargin, yPos, rightMargin, yPos + height);
    
    // Add text - SMALLER FONT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, leftMargin + 1, yPos + 4.5); // Tighter positioning
    
    if (value) {
      const valueWidth = rightMargin - (leftMargin + labelWidth) - 2;
      const valueLines = doc.splitTextToSize(value.toString(), valueWidth);
      if (valueLines.length === 1) {
        doc.text(value.toString(), leftMargin + labelWidth + 1, yPos + 4.5);
      } else {
        // For multi-line values, use tight spacing
        const actualHeight = valueLines.length * 5 + 2; // Very tight line spacing
        // Redraw vertical lines with new height
        doc.line(leftMargin, yPos, leftMargin, yPos + actualHeight);
        doc.line(leftMargin + labelWidth, yPos, leftMargin + labelWidth, yPos + actualHeight);
        doc.line(rightMargin, yPos, rightMargin, yPos + actualHeight);
        
        valueLines.forEach((line, index) => {
          doc.text(line, leftMargin + labelWidth + 1, yPos + 4.5 + (index * 5));
        });
        yPos += actualHeight;
        return;
      }
    }
    
    yPos += height;
  };
  
  // Draw Member Information fields
  drawTableRow('Date', formData.date);
  drawTableRow('Member Name', formData.memberName);
  drawTableRow('Alcor Number', formData.alcorNumber || 'A-');
  drawTableRow('Age', formData.age);
  drawTableRow('Address', formData.address);
  drawTableRow('Phone', formData.phone);
  drawTableRow('Emergency/POA Contact', formData.emergencyContact);
  drawTableRow('Height/Weight', formData.heightWeight);
  
  // Draw bottom line
  doc.line(leftMargin, yPos, rightMargin, yPos);
  
  // Add Medical Information section - MINIMAL SPACING
  yPos += 8; // Very small gap
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAL INFORMATION', 105, yPos, { align: 'center' });
  yPos += 8; // Minimal spacing after title
  
  // Add "What's going on" if provided - REMOVED FROM MEDICAL INFO TABLE
  // It will go in NOTES section as shown in the example
  
  // Draw Medical Information fields
  drawTableRow('Medical Condition:', formData.medicalCondition);
  drawTableRow('Facility Address:', formData.facilityAddress);
  drawTableRow('Phone:', formData.facilityPhone);
  drawTableRow('Fax:', formData.facilityFax);
  drawTableRow('Date of Surgery:', formData.dateOfSurgery);
  drawTableRow('Time Surgery to Start:', formData.surgeryStartTime);
  drawTableRow('Time Surgery to End:', formData.surgeryEndTime);
  drawTableRow('Type of Surgery:', formData.typeOfSurgery);
  drawTableRow('Using Anesthesia:', formData.usingAnesthesia);
  drawTableRow('Physician Name:', formData.physicianName);
  drawTableRow('Physician Phone:', formData.physicianPhone);
  
  // Multi-line questions - CONDENSED
  const multiLineQuestions = [
    { label: 'Is physician aware of cryonics arrangements?', value: formData.physicianAwareOfCryonics },
    { label: 'Can you send us a copy of your current POA for health care (if not already on file)?', value: formData.poaOnFile }
  ];
  
  multiLineQuestions.forEach(({ label, value }) => {
    const labelLines = doc.splitTextToSize(label, labelWidth - 2);
    const rowHeight = labelLines.length * 5 + 2; // Very tight
    
    // Draw the row
    doc.line(leftMargin, yPos, rightMargin, yPos);
    doc.line(leftMargin, yPos, leftMargin, yPos + rowHeight);
    doc.line(leftMargin + labelWidth, yPos, leftMargin + labelWidth, yPos + rowHeight);
    doc.line(rightMargin, yPos, rightMargin, yPos + rowHeight);
    
    // Add text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    labelLines.forEach((line, index) => {
      doc.text(line, leftMargin + 1, yPos + 4.5 + (index * 5));
    });
    
    doc.text(value || '', leftMargin + labelWidth + 1, yPos + 4.5);
    
    yPos += rowHeight;
  });
  
  // Draw final bottom line
  doc.line(leftMargin, yPos, rightMargin, yPos);
  
  // Add NOTES section - AS SHOWN IN EXAMPLE
  yPos += 12; // Small gap before NOTES
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTES', 105, yPos, { align: 'center' });
  
  // Add empty space for notes area (as shown in your example)
  // If whatsGoingOn has content, add it here
  if (formData.whatsGoingOn && formData.whatsGoingOn.trim()) {
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(formData.whatsGoingOn, rightMargin - leftMargin);
    noteLines.forEach((line, index) => {
      doc.text(line, leftMargin, yPos + (index * 6));
    });
  }
  
  return doc;
};