// Note: This component requires jsPDF to be installed:
// npm install jspdf

// Note: This component requires jsPDF to be installed:
// npm install jspdf

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Phone, User, FileText, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import alcorStar from '../../assets/images/alcor-star.png';
//import alcorLogo from '../../assets/images/alcor-logo.png'; // You'll need to add this
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { sendProcedureNotificationEmail } from '../../services/auth'; 
import { useUser } from '../../contexts/UserContext';


const ProcedureTab = ({ contactId }) => {
  // Hardcoded wider setting - set to true to make desktop content 20% wider
  const wider = false;
  
  // Get member data from context - using the same pattern as sidebar
  const { memberInfoData, memberNumber, salesforceCustomer, customerFirstName, memberInfoLoaded, refreshMemberInfo } = useMemberPortal();
  const { currentUser } = useUser();
  
  const [formData, setFormData] = useState({
    // Member Information
    date: new Date().toISOString().split('T')[0] + ' - ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), // Date with timestamp
    memberName: '',
    alcorNumber: '',
    age: '',
    address: '',
    phone: '',
    emergencyContact: '',
    heightWeight: '',
    
    // Medical Information
    whatsGoingOn: '', // New field - not required
    medicalCondition: '',
    facilityAddress: '',
    facilityPhone: '',
    facilityFax: '',
    dateOfSurgery: '',
    surgeryStartTime: '',
    surgeryEndTime: '',
    typeOfSurgery: '',
    usingAnesthesia: '',
    physicianName: '',
    physicianPhone: '',
    physicianAwareOfCryonics: '',
    poaOnFile: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [submittedPdfBlob, setSubmittedPdfBlob] = useState(null);
  const [submittedPdfName, setSubmittedPdfName] = useState('');
  const [submittedPoaStatus, setSubmittedPoaStatus] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Load member info if not loaded
  useEffect(() => {
    const loadMemberInfo = async () => {
      if (!memberInfoLoaded && salesforceCustomer?.id && refreshMemberInfo) {
        console.log('ProcedureTab: Loading member info for contactId:', salesforceCustomer.id);
        try {
          // This will trigger the member info load in the context
          await refreshMemberInfo();
        } catch (error) {
          console.error('ProcedureTab: Error loading member info:', error);
        }
      }
    };
    
    loadMemberInfo();
  }, [salesforceCustomer?.id, memberInfoLoaded, refreshMemberInfo]);

  // Prepopulate form with member data - using salesforceCustomer like the sidebar
  useEffect(() => {
    console.log('ProcedureTab - salesforceCustomer:', salesforceCustomer);
    console.log('ProcedureTab - currentUser:', currentUser);
    console.log('ProcedureTab - memberInfoData:', memberInfoData);
    
    const updates = {};
    const fieldsToTouch = {};
    
    // First try to get data from salesforceCustomer (like sidebar does)
    if (salesforceCustomer) {
      // Get member name
      if (salesforceCustomer.firstName || salesforceCustomer.lastName) {
        const firstName = salesforceCustomer.firstName || '';
        const lastName = salesforceCustomer.lastName || '';
        updates.memberName = `${firstName} ${lastName}`.trim();
        fieldsToTouch.memberName = true;
      }
      
      // Get Alcor number
      if (salesforceCustomer.alcorId) {
        updates.alcorNumber = salesforceCustomer.alcorId;
        fieldsToTouch.alcorNumber = true;
      }
      
      // Get email/phone if available
      if (salesforceCustomer.email) {
        // Store email for reference, though not directly used in form
      }
      
      if (salesforceCustomer.phone) {
        updates.phone = salesforceCustomer.phone;
        fieldsToTouch.phone = true;
      }
    }
    
    // Also try to get additional data from memberInfoData if it's loaded
    if (memberInfoData) {
      // Override with more detailed info if available
      if (memberInfoData.personal?.data) {
        const personal = memberInfoData.personal.data.data || memberInfoData.personal.data;
        console.log('Personal data found:', personal);
        
        // Update name if we have it
        if (personal.firstName || personal.lastName) {
          const firstName = personal.firstName || '';
          const lastName = personal.lastName || '';
          updates.memberName = `${firstName} ${lastName}`.trim();
          fieldsToTouch.memberName = true;
        }
        
        // Calculate age from date of birth
        if (personal.dateOfBirth) {
          const birthDate = new Date(personal.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          updates.age = age.toString();
          fieldsToTouch.age = true;
        }
        
        // Get Alcor number from personal info if available
        if (personal.alcorId) {
          updates.alcorNumber = personal.alcorId;
          fieldsToTouch.alcorNumber = true;
        }
      }
      
      // Get address
      if (memberInfoData.addresses?.data) {
        const addressData = memberInfoData.addresses.data;
        console.log('Address data structure:', addressData);
        
        // Check if data property exists and has the actual data
        const addresses = addressData.data || addressData;
        
        // Try home address first
        if (addresses.homeAddress && addresses.homeAddress.street) {
          const addr = addresses.homeAddress;
          const addressParts = [
            addr.street,
            addr.city,
            addr.state,
            addr.postalCode || addr.postalcode,
            addr.country
          ].filter(Boolean);
          if (addressParts.length > 0) {
            updates.address = addressParts.join(', ');
            fieldsToTouch.address = true;
            console.log('Using home address:', updates.address);
          }
        }
        // Fall back to mailing address if no home address or home address is empty
        else if (addresses.mailingAddress && addresses.mailingAddress.street) {
          const addr = addresses.mailingAddress;
          const addressParts = [
            addr.street,
            addr.city,
            addr.state,
            addr.postalCode || addr.postalcode,
            addr.country
          ].filter(Boolean);
          if (addressParts.length > 0) {
            updates.address = addressParts.join(', ');
            fieldsToTouch.address = true;
            console.log('Using mailing address:', updates.address);
          }
        }
      }
      
      // Get phone
      if (memberInfoData.contact?.data) {
        const contact = memberInfoData.contact.data.data || memberInfoData.contact.data;
        // Use preferred phone if available
        if (contact.preferredPhone && contact[contact.preferredPhone.toLowerCase() + 'Phone']) {
          updates.phone = contact[contact.preferredPhone.toLowerCase() + 'Phone'];
          fieldsToTouch.phone = true;
        } else if (contact.mobilePhone) {
          updates.phone = contact.mobilePhone;
          fieldsToTouch.phone = true;
        } else if (contact.homePhone) {
          updates.phone = contact.homePhone;
          fieldsToTouch.phone = true;
        }
      }
      
      // Get emergency contact
      if (memberInfoData.emergency?.data) {
        const emergencyData = memberInfoData.emergency.data;
        const nextOfKinArray = emergencyData.data?.nextOfKin || 
                               emergencyData.nextOfKin || 
                               emergencyData || 
                               [];
        
        if (Array.isArray(nextOfKinArray) && nextOfKinArray.length > 0) {
          const primary = nextOfKinArray[0];
          if (primary.firstName || primary.lastName) {
            const name = `${primary.firstName || ''} ${primary.lastName || ''}`.trim();
            const phone = primary.mobilePhone || primary.homePhone || '';
            updates.emergencyContact = phone ? `${name} - ${phone}` : name;
            fieldsToTouch.emergencyContact = true;
          }
        }
      }
      
      // Get height and weight from medical info
      if (memberInfoData.medical?.data) {
        const medical = memberInfoData.medical.data.data || memberInfoData.medical.data;
        const heightWeight = [];
        
        if (medical.height) {
          heightWeight.push(`${medical.height}`);
        }
        
        if (medical.weight) {
          heightWeight.push(`${medical.weight} lbs`);
        }
        
        if (heightWeight.length > 0) {
          updates.heightWeight = heightWeight.join(', ');
          fieldsToTouch.heightWeight = true;
        }
      }
    }
    
    // If we still don't have a name, try currentUser
    if (!updates.memberName && currentUser?.displayName) {
      updates.memberName = currentUser.displayName;
      fieldsToTouch.memberName = true;
    }
    
    // If we still don't have Alcor number, try memberNumber from context
    if (!updates.alcorNumber && memberNumber) {
      updates.alcorNumber = memberNumber;
      fieldsToTouch.alcorNumber = true;
    }
    
    // Update form data with prepopulated values
    if (Object.keys(updates).length > 0) {
      console.log('Applying updates to form:', updates);
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
      
      // Mark autopopulated fields as touched so they don't show as invalid
      setTouchedFields(prev => ({
        ...prev,
        ...fieldsToTouch
      }));
    }
  }, [salesforceCustomer, memberInfoData, memberNumber, currentUser]);

  // Add Helvetica font
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .procedure-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .procedure-tab .font-bold,
      .procedure-tab .font-semibold {
        font-weight: 500 !important;
      }
      .procedure-tab .font-bold {
        font-weight: 700 !important;
      }
      .procedure-tab h1 {
        font-weight: 300 !important;
      }
      .procedure-tab h2,
      .procedure-tab h3,
      .procedure-tab h4 {
        font-weight: 400 !important;
      }
      .procedure-tab .font-medium {
        font-weight: 400 !important;
      }
      .procedure-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .procedure-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .procedure-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      .procedure-tab .slide-in-delay-2 {
        animation: slideIn 0.6s ease-out 0.2s both;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .procedure-tab .error-input {
        border-color: #ef4444 !important;
      }
      .procedure-tab .error-text {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
      /* Fix for Chrome autofill border disappearing */
      .procedure-tab input:-webkit-autofill,
      .procedure-tab input:-webkit-autofill:hover,
      .procedure-tab input:-webkit-autofill:focus,
      .procedure-tab input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        box-shadow: 0 0 0 30px white inset !important;
        border: 1px solid #d1d5db !important;
      }
      .procedure-tab input:-webkit-autofill:focus {
        border: 2px solid #12243c !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Mark field as touched when user interacts with it
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const isFieldInvalid = (fieldName) => {
    // whatsGoingOn is not required, so it's never invalid
    if (fieldName === 'whatsGoingOn') {
      return false;
    }
    return touchedFields[fieldName] && (!formData[fieldName] || formData[fieldName].toString().trim() === '');
  };

  const generatePDF = () => {
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== SUBMIT CLICKED ===');
    console.log('showSuccess before:', showSuccess);
    
    // Mark all fields as touched to show validation errors
    const allFieldsTouched = {};
    Object.keys(formData).forEach(key => {
      allFieldsTouched[key] = true;
    });
    setTouchedFields(allFieldsTouched);
    
    // Check every single field EXCEPT whatsGoingOn
    let hasEmptyFields = false;
    for (const [key, value] of Object.entries(formData)) {
      // Skip whatsGoingOn since it's not required
      if (key === 'whatsGoingOn') {
        continue;
      }
      if (!value || value.toString().trim() === '') {
        console.log(`Field "${key}" is empty:`, value);
        hasEmptyFields = true;
      }
    }
    
    // If ANY required field is empty, stop right here
    if (hasEmptyFields) {
      console.log('VALIDATION FAILED - hasEmptyFields is true');
      console.log('Setting error message and returning...');
      setSaveMessage('Please fill in all required fields.');
      setTimeout(() => setSaveMessage(''), 3000);
      console.log('RETURNING NOW - THIS SHOULD STOP EVERYTHING');
      return; // STOP - DO NOT CONTINUE
    }
    
    console.log('VALIDATION PASSED - All fields have values');
    console.log('About to show success screen...');
    
    // Only get here if ALL required fields are filled
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Generate PDF
      const pdfDoc = generatePDF();
      const pdfBlob = pdfDoc.output('blob');
      
      // Create filename with today's date hyphenated
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
      const pdfFileName = `procedure-submission-${dateStr}.pdf`;
      
      // Convert blob to base64 for API
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1];
          
          // Call the API
          const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
          const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents`;
          
          const requestBody = {
            title: pdfFileName,
            fileData: base64Data,
            fileType: 'application/pdf'
          };
          
          console.log('Submitting procedure form as PDF:', pdfFileName);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
          });
          
          const responseData = await response.json();
          
          if (response.ok && responseData.success) {
            console.log('Procedure form submitted successfully!');
            console.log('Response data:', responseData);
            
            // Check if we should send email
            if (responseData.data?.shouldSendEmail && responseData.data?.emailData) {
              console.log('📧 Backend indicates email should be sent');
              console.log('Email data from backend:', responseData.data.emailData);
              
              try {
                console.log('🚀 Calling sendProcedureNotificationEmail...');
                
                // Call the service function to send email
                const emailResult = await sendProcedureNotificationEmail({
                  memberName: responseData.data.emailData.memberName,
                  memberNumber: responseData.data.emailData.memberNumber,
                  pdfData: base64Data,
                  fileName: pdfFileName
                });
                
                console.log('📧 Email function result:', emailResult);
                
                if (emailResult.success) {
                  console.log('✅ Email notification sent successfully');
                  console.log('Message ID:', emailResult.messageId);
                  console.log('Recipient:', emailResult.recipientEmail);
                } else {
                  console.warn('⚠️ Failed to send email notification:', emailResult.error);
                  // Don't fail the submission if email fails
                }
              } catch (emailError) {
                console.error('❌ Error sending email notification:', emailError);
                // Don't fail the submission if email fails
              }
            } else {
              console.log('📧 No email needed:', {
                shouldSendEmail: responseData.data?.shouldSendEmail,
                hasEmailData: !!responseData.data?.emailData
              });
            }
            
            // Store the PDF blob and filename for download
            setSubmittedPdfBlob(pdfBlob);
            setSubmittedPdfName(pdfFileName);
            
            // Store POA status for success screen
            setSubmittedPoaStatus(formData.poaOnFile);
            
            // Clear form data but keep prepopulated fields
            const memberName = formData.memberName;
            const alcorNumber = formData.alcorNumber;
            const age = formData.age;
            const address = formData.address;
            const phone = formData.phone;
            const emergencyContact = formData.emergencyContact;
            
            setFormData({
              date: new Date().toISOString().split('T')[0] + ' - ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), // Date with timestamp
              memberName: memberName,
              alcorNumber: alcorNumber,
              age: age,
              address: address,
              phone: phone,
              emergencyContact: emergencyContact,
              heightWeight: '',
              whatsGoingOn: '',
              medicalCondition: '',
              facilityAddress: '',
              facilityPhone: '',
              facilityFax: '',
              dateOfSurgery: '',
              surgeryStartTime: '',
              surgeryEndTime: '',
              typeOfSurgery: '',
              usingAnesthesia: '',
              physicianName: '',
              physicianPhone: '',
              physicianAwareOfCryonics: '',
              poaOnFile: ''
            });
            
            // Clear touched fields
            setTouchedFields({});
            
            // On success, show success view
            setShowSuccess(true);
          } else {
            console.error('Failed to submit procedure form:', responseData.error);
            setSaveMessage(`Error submitting procedure: ${responseData.error || 'Unknown error'}`);
            setTimeout(() => setSaveMessage(''), 5000);
          }
        } catch (err) {
          console.error('Error in API call:', err);
          setSaveMessage('Error submitting procedure. Please try again.');
          setTimeout(() => setSaveMessage(''), 5000);
        } finally {
          setIsSaving(false);
        }
      };
      
      reader.onerror = () => {
        setSaveMessage('Error processing PDF. Please try again.');
        setTimeout(() => setSaveMessage(''), 5000);
        setIsSaving(false);
      };
      
      reader.readAsDataURL(pdfBlob);
      
    } catch (error) {
      console.error('Error submitting:', error);
      setSaveMessage('Error submitting procedure information. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
      setIsSaving(false);
    }
  };

  const handleViewMemberFiles = () => {
    // This will be handled by the parent component through navigation
    window.location.hash = 'membership-memberfiles';
  };

  const handleSubmitAnother = () => {
    // Reset success state to show form again
    setShowSuccess(false);
    // Clear the stored PDF
    setSubmittedPdfBlob(null);
    setSubmittedPdfName('');
    setSubmittedPoaStatus('');
  };

  const handleDownloadSubmission = () => {
    if (submittedPdfBlob && submittedPdfName) {
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(submittedPdfBlob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = submittedPdfName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  // Container classes that change based on wider setting
  const containerClasses = wider 
    ? "procedure-tab w-full -mx-10 pt-6"
    : "procedure-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4 pt-6 md:pt-8";

  return (
    <div className={containerClasses}>
      {showSuccess ? (
        // Success View
        <>
          {/* Mobile Success View */}
          <div className="sm:hidden">
            <div className="bg-white shadow-md border border-gray-400 rounded-b-[1.5rem] overflow-hidden slide-in mx-4 mt-6" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
              {/* Success Header */}
              <div className="px-6 py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
                <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md">
                  <CheckCircle className="w-5 h-5 text-white drop-shadow-sm mr-3" />
                  Success!
                  <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
                </h2>
              </div>

              {/* Success Content */}
              <div className="px-8 py-10 text-center">
                <div className="mb-6">
                  <div className="w-12 h-12 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Successfully Submitted!</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-normal mb-2">
                    Your procedure information has been sent to Alcor's team.
                  </p>
                  <p className="text-gray-600 text-xs">
                    We'll review the details and prepare for your upcoming procedure.
                  </p>
                </div>
                
                {/* POA Upload Reminder */}
                {submittedPoaStatus === 'no' && (
                  <div className="bg-amber-50 rounded-xl p-4 text-left mb-6 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900 mb-1">Action Required: Upload POA</p>
                        <p className="text-xs text-amber-800 mb-2">
                          Please upload your Power of Attorney for healthcare as soon as possible.
                        </p>
                        <button
                          onClick={() => window.location.hash = 'membership-documents'}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900"
                        >
                          <span>Upload to Documents</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleDownloadSubmission}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>Download PDF Copy</span>
                  </button>
                  
                  <button
                    onClick={handleViewMemberFiles}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#2a1b3d] to-[#6e4376] hover:from-[#3a2b4d] hover:to-[#7e5386] rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <FileText className="w-4 h-4" strokeWidth="1.5" />
                    <span>View Your Documents</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Success View */}
          <div className="hidden sm:block">
            <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] slide-in" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              <div className={`${wider ? 'p-10' : 'p-8'} text-center`}>
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Successfully Submitted!</h3>
                  <p className="text-gray-700 text-base leading-relaxed font-normal mb-2">
                    Your procedure information has been sent to Alcor's team.
                  </p>
                  <p className="text-gray-600 text-sm mb-8">
                    We'll review the details and prepare for your upcoming procedure.
                  </p>
                  
                  {/* POA Upload Reminder */}
                  {submittedPoaStatus === 'no' && (
                    <div className="bg-amber-50 rounded-xl p-5 text-left mb-8 border border-amber-200">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-amber-900 mb-1">Action Required: Upload POA</p>
                          <p className="text-sm text-amber-800 mb-3">
                            Please upload your Power of Attorney for healthcare as soon as possible.
                          </p>
                          <button
                            onClick={() => window.location.hash = 'membership-documents'}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900"
                          >
                            <span>Upload to Documents</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleDownloadSubmission}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm text-gray-600 border border-gray-300 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>Download PDF Copy</span>
                    </button>
                    
                    <button
                      onClick={handleViewMemberFiles}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#2a1b3d] to-[#6e4376] hover:from-[#3a2b4d] hover:to-[#7e5386] rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <FileText className="w-4 h-4" strokeWidth="1.5" />
                      <span>View Your Documents</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Form View
        <form onSubmit={handleSubmit}>
          {/* Mobile: Single Column Layout */}
          <div className="sm:hidden">
            {/* Single Form Container */}
            <div className="bg-white shadow-md border border-gray-400 rounded-b-[1.5rem] overflow-hidden slide-in mx-4 mt-6" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
              {/* Header */}
              <div className="px-6 py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
                <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md">
                  <FileText className="w-5 h-5 text-white drop-shadow-sm mr-3" />
                  Upcoming Procedure
                  <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
                </h2>
              </div>

              {/* Description */}
              <div className="px-8 py-10 border-b border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed font-normal">
                  Please provide detailed information about your upcoming medical procedure. This information helps Alcor prepare for any potential standby or stabilization needs.
                </p>
              </div>

              {/* Form Fields */}
              <div className="px-6 py-6 space-y-6">
                {/* Medical Information Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-200">Medical Information</h3>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        In a few sentences, share what's going on?
                      </label>
                      <div className="relative inline-block">
                        <HelpCircle 
                          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                          strokeWidth={2}
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                          onClick={() => setShowTooltip(!showTooltip)}
                        />
                        {showTooltip && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-64">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  Help
                                </h3>
                                <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                                </svg>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm text-gray-700">
                                You're on this form to tell us about your upcoming procedure - so in a few sentences, share what's been going on (your symptoms, concerns or questions, and any steps you've already taken). We'll ask for the exact procedure details next.
                              </p>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                              <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      name="whatsGoingOn"
                      value={formData.whatsGoingOn}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="2"
                      placeholder="Brief description (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Condition <span className="text-red-500">*</span></label>
                    <textarea
                      name="medicalCondition"
                      value={formData.medicalCondition}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('medicalCondition') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('medicalCondition') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility Address <span className="text-red-500">*</span></label>
                    <textarea
                      name="facilityAddress"
                      value={formData.facilityAddress}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="2"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('facilityAddress') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('facilityAddress') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="facilityPhone"
                      value={formData.facilityPhone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('facilityPhone') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('facilityPhone') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility Fax <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="facilityFax"
                      value={formData.facilityFax}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('facilityFax') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('facilityFax') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Surgery <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="dateOfSurgery"
                      value={formData.dateOfSurgery}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('dateOfSurgery') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('dateOfSurgery') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Surgery to Start <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      name="surgeryStartTime"
                      value={formData.surgeryStartTime}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('surgeryStartTime') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('surgeryStartTime') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Surgery to End <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      name="surgeryEndTime"
                      value={formData.surgeryEndTime}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('surgeryEndTime') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('surgeryEndTime') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type of Surgery <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="typeOfSurgery"
                      value={formData.typeOfSurgery}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('typeOfSurgery') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('typeOfSurgery') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Using Anesthesia <span className="text-red-500">*</span></label>
                    <select
                      name="usingAnesthesia"
                      value={formData.usingAnesthesia}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('usingAnesthesia') ? 'error-input' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {isFieldInvalid('usingAnesthesia') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Physician Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="physicianName"
                      value={formData.physicianName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('physicianName') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('physicianName') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Physician Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="physicianPhone"
                      value={formData.physicianPhone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('physicianPhone') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('physicianPhone') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Is physician aware of cryonics arrangements? <span className="text-red-500">*</span></label>
                    <select
                      name="physicianAwareOfCryonics"
                      value={formData.physicianAwareOfCryonics}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('physicianAwareOfCryonics') ? 'error-input' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {isFieldInvalid('physicianAwareOfCryonics') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Can you send us a copy of your current POA for health care (if not already on file)? <span className="text-red-500">*</span></label>
                    <select
                      name="poaOnFile"
                      value={formData.poaOnFile}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('poaOnFile') ? 'error-input' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="already_on_file">Already on file</option>
                    </select>
                    {isFieldInvalid('poaOnFile') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>
                </div>

                {/* Member Information Section */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-200">Member Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="date"
                      value={formData.date}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="memberName"
                      value={formData.memberName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('memberName') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('memberName') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alcor Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="alcorNumber"
                      value={formData.alcorNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="A-####"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('alcorNumber') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('alcorNumber') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      min="1"
                      max="150"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('age') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('age') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="2"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('address') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('address') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('phone') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('phone') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency/POA Contact <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('emergencyContact') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('emergencyContact') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height/Weight <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="heightWeight"
                      value={formData.heightWeight}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('heightWeight') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('heightWeight') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-[#12243c] to-[#1a2f4a] hover:from-[#1a2f4a] hover:to-[#243a5a] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>Submit Procedure</span>
                    </>
                  )}
                </button>
                {saveMessage && (
                  <p className={`mt-3 text-center text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Single Form Layout */}
          <div className="hidden sm:block">
            <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] slide-in" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              {/* Header */}
              <div className={`${wider ? 'p-10' : 'p-8'} border-b border-gray-100`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Upcoming Procedure</h3>
                </div>
                <p className={`text-gray-700 text-sm leading-relaxed font-normal ${wider ? 'max-w-3xl' : 'max-w-xl'}`}>
                  Please provide detailed information about your upcoming medical procedure. This information helps Alcor prepare for any potential standby or stabilization needs.
                </p>
              </div>

              {/* Form Content */}
              <div className={`${wider ? 'p-10' : 'p-8'}`}>
                <div className={`space-y-8 ${wider ? 'max-w-6xl' : 'max-w-4xl'}`}>
                  {/* Medical Information Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Medical Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            In a few sentences, share what's going on?
                          </label>
                          <div className="relative inline-block">
                            <HelpCircle 
                              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                              strokeWidth={2}
                              onMouseEnter={() => setShowTooltip(true)}
                              onMouseLeave={() => setShowTooltip(false)}
                              onClick={() => setShowTooltip(!showTooltip)}
                            />
                            {showTooltip && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-72">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      Help
                                    </h3>
                                    <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="px-4 py-3">
                                  <p className="text-sm text-gray-700">
                                    You're on this form to tell us about your upcoming procedure - so in a few sentences, share what's been going on (your symptoms, concerns or questions, and any steps you've already taken). We'll ask for the exact procedure details next.
                                  </p>
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <textarea
                          name="whatsGoingOn"
                          value={formData.whatsGoingOn}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          rows="2"
                          placeholder="Brief description (optional)"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medical Condition <span className="text-red-500">*</span></label>
                        <textarea
                          name="medicalCondition"
                          value={formData.medicalCondition}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          rows="3"
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('medicalCondition') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('medicalCondition') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facility Address <span className="text-red-500">*</span></label>
                        <textarea
                          name="facilityAddress"
                          value={formData.facilityAddress}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          rows="2"
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('facilityAddress') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('facilityAddress') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facility Phone <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          name="facilityPhone"
                          value={formData.facilityPhone}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('facilityPhone') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('facilityPhone') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facility Fax <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          name="facilityFax"
                          value={formData.facilityFax}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('facilityFax') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('facilityFax') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Surgery <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          name="dateOfSurgery"
                          value={formData.dateOfSurgery}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('dateOfSurgery') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('dateOfSurgery') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type of Surgery <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="typeOfSurgery"
                          value={formData.typeOfSurgery}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('typeOfSurgery') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('typeOfSurgery') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Surgery to Start <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          name="surgeryStartTime"
                          value={formData.surgeryStartTime}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('surgeryStartTime') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('surgeryStartTime') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Surgery to End <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          name="surgeryEndTime"
                          value={formData.surgeryEndTime}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('surgeryEndTime') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('surgeryEndTime') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Using Anesthesia <span className="text-red-500">*</span></label>
                        <select
                          name="usingAnesthesia"
                          value={formData.usingAnesthesia}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('usingAnesthesia') ? 'error-input' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        {isFieldInvalid('usingAnesthesia') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Physician Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="physicianName"
                          value={formData.physicianName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('physicianName') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('physicianName') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Physician Phone <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          name="physicianPhone"
                          value={formData.physicianPhone}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('physicianPhone') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('physicianPhone') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Is physician aware of cryonics arrangements? <span className="text-red-500">*</span></label>
                        <select
                          name="physicianAwareOfCryonics"
                          value={formData.physicianAwareOfCryonics}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('physicianAwareOfCryonics') ? 'error-input' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        {isFieldInvalid('physicianAwareOfCryonics') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Can you send us a copy of your current POA for health care (if not already on file)? <span className="text-red-500">*</span></label>
                        <select
                          name="poaOnFile"
                          value={formData.poaOnFile}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('poaOnFile') ? 'error-input' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                          <option value="already_on_file">Already on file</option>
                        </select>
                        {isFieldInvalid('poaOnFile') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Information Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Member Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="date"
                          value={formData.date}
                          readOnly
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Member Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="memberName"
                          value={formData.memberName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('memberName') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('memberName') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alcor Number <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="alcorNumber"
                          value={formData.alcorNumber}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="A-####"
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('alcorNumber') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('alcorNumber') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          min="1"
                          max="150"
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('age') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('age') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address <span className="text-red-500">*</span></label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          rows="2"
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('address') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('address') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('phone') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('phone') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency/POA Contact <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('emergencyContact') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('emergencyContact') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Height/Weight <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="heightWeight"
                          value={formData.heightWeight}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent ${
                            isFieldInvalid('heightWeight') ? 'error-input' : 'border-gray-300'
                          }`}
                        />
                        {isFieldInvalid('heightWeight') && (
                          <p className="error-text">This field is required</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-[#12243c] to-[#1a2f4a] hover:from-[#1a2f4a] hover:to-[#243a5a] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        <span>Submit Procedure</span>
                      </>
                    )}
                  </button>
                  {saveMessage && (
                    <p className={`mt-3 text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                      {saveMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProcedureTab;