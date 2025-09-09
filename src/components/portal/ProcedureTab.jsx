// Note: This component requires jsPDF to be installed:
// npm install jspdf

// Note: This component requires jsPDF to be installed:
// npm install jspdf

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, Phone, User, FileText, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import alcorStar from '../../assets/images/alcor-star.png';
//import alcorLogo from '../../assets/images/alcor-logo.png'; // You'll need to add this
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { sendProcedureNotificationEmail } from '../../services/auth'; 
import { useUser } from '../../contexts/UserContext';
import { auth } from '../../services/firebase';
import ProcedureFormView from './ProcedureFormView';
import ProcedureSuccessView from './ProcedureSuccessView';
import { generateProcedurePDF } from './ProcedureUtils';
import { API_BASE_URL } from '../../config/api';


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

  // Load member info if not loaded - SIMPLIFIED FIX
  useEffect(() => {
    // Only fetch if we have an ID, data isn't loaded, and we have the refresh function
    if (salesforceCustomer?.id && !memberInfoLoaded && refreshMemberInfo) {
      console.log('ProcedureTab: Calling refreshMemberInfo for:', salesforceCustomer.id);
      refreshMemberInfo().then(() => {
        console.log('ProcedureTab: Member info refresh completed');
      }).catch(error => {
        console.error('ProcedureTab: Error refreshing member info:', error);
      });
    }
    // Only depend on the ID and loaded state, NOT the function
  }, [salesforceCustomer?.id, memberInfoLoaded]);

  // Prepopulate form with member data - using salesforceCustomer like the sidebar
  useEffect(() => {
    console.log('ProcedureTab - salesforceCustomer:', salesforceCustomer);
    console.log('ProcedureTab - currentUser:', currentUser);
    console.log('ProcedureTab - memberInfoData:', memberInfoData);
    
    // Log email sources for debugging
    console.log('📧 Available email sources:', {
      salesforceEmail: salesforceCustomer?.email,
      currentUserEmail: currentUser?.email,
      firebaseAuthEmail: auth.currentUser?.email,
      contactDataEmail: memberInfoData?.contact?.data?.email,
      personalDataEmail: memberInfoData?.personal?.data?.email
    });
    
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
          heightWeight.push(`${medical.weight}`);
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
      const pdfDoc = generateProcedurePDF(formData);
      const pdfBlob = pdfDoc.output('blob');
      
      // Create filename with today's date hyphenated
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
      const pdfFileName = `procedure_submission_${dateStr}.pdf`;
      
      // Convert blob to base64 for API
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1];
          
          // Call the API
          //const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
          const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents`;
          
          const requestBody = {
            title: pdfFileName,
            fileData: base64Data,
            fileType: 'application/pdf'
          };
          
          console.log('Submitting procedure form as PDF:', pdfFileName);
          
          // Get the auth token from Firebase
          const token = await auth.currentUser.getIdToken();
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
          });
          
          const responseData = await response.json();
          
          if (response.ok && responseData.success) {
            console.log('Procedure form submitted successfully!');
            console.log('Response data:', responseData);
            
            let emailSent = false;
            let emailError = null;
            
            // Check if we should send email
            if (responseData.data?.shouldSendEmail && responseData.data?.emailData) {
              console.log('📧 Backend indicates email should be sent');
              console.log('Email data from backend:', responseData.data.emailData);
              
              try {
                console.log('🚀 Calling sendProcedureNotificationEmail...');
                
                // Debug email retrieval
                const userEmail = salesforceCustomer?.email || currentUser?.email || '';
                console.log('📧 User email retrieval:', {
                  salesforceCustomer: salesforceCustomer,
                  salesforceEmail: salesforceCustomer?.email,
                  currentUser: currentUser,
                  firebaseEmail: currentUser?.email,
                  finalEmail: userEmail,
                  hasEmail: !!userEmail
                });
                
                // Additional fallback options if needed
                if (!userEmail) {
                  console.warn('⚠️ No user email found! Checking other sources...');
                  console.log('Other potential sources:', {
                    memberInfoData: memberInfoData,
                    contactEmail: memberInfoData?.contact?.data?.email,
                    personalEmail: memberInfoData?.personal?.data?.email,
                    firebaseAuth: auth.currentUser?.email
                  });
                }
                
                // Call the service function to send email
                const emailResult = await sendProcedureNotificationEmail({
                  memberName: responseData.data.emailData.memberName,
                  memberNumber: responseData.data.emailData.memberNumber,
                  pdfData: base64Data,
                  fileName: pdfFileName,
                  userEmail: userEmail
                });
                
                console.log('📧 Email function result:', emailResult);
                
                if (emailResult.success) {
                  console.log('✅ Email notification sent successfully');
                  console.log('Message ID:', emailResult.messageId);
                  console.log('Recipient:', emailResult.recipientEmail);
                  console.log('User copy sent:', emailResult.userEmailSent);
                  emailSent = true;
                } else {
                  console.error('⚠️ Failed to send email notification:', emailResult.error);
                  emailError = emailResult.error || 'Failed to send notification email';
                  emailSent = false;
                }
              } catch (error) {
                console.error('❌ Error sending email notification:', error);
                emailError = error.message || 'Error sending notification email';
                emailSent = false;
              }
              
              // If email was supposed to be sent but failed, show error and stop
              if (!emailSent) {
                setSaveMessage(`⚠️ SUBMISSION INCOMPLETE: Your procedure form was saved but we could not send the notification to Alcor staff. Please contact Alcor immediately at info@alcor.org or call 480-905-1906 to ensure they are aware of your procedure. Error: ${emailError}`);
                setIsSaving(false);
                return; // Stop here - don't show success screen
              }
            } else {
              console.log('📧 No email needed:', {
                shouldSendEmail: responseData.data?.shouldSendEmail,
                hasEmailData: !!responseData.data?.emailData
              });
              // If backend says no email needed, that's a problem for procedure forms
              setSaveMessage('⚠️ SUBMISSION ERROR: Unable to send notification. Please contact Alcor immediately at info@alcor.org or call 480-905-1906 to report this procedure.');
              setIsSaving(false);
              return; // Stop here - don't show success screen
            }
            
            // Only reach here if everything succeeded (document saved AND email sent)
            console.log('✅ Both document upload and email notification succeeded!');
            
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
              date: new Date().toISOString().split('T')[0] + ' - ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
            setSaveMessage(`⚠️ SUBMISSION FAILED: Your procedure form could not be submitted. Please contact Alcor immediately at info@alcor.org or call 480-905-1906 to report this procedure. Error: ${responseData.error || 'Unknown error'}`);
            setTimeout(() => setSaveMessage(''), 10000);
          }
        } catch (err) {
          console.error('Error in API call:', err);
          setSaveMessage('⚠️ SUBMISSION FAILED: Unable to submit your procedure form. Please contact Alcor immediately at info@alcor.org or call 480-905-1906 to report this procedure.');
          setTimeout(() => setSaveMessage(''), 10000);
        } finally {
          setIsSaving(false);
        }
      };
      
      reader.onerror = () => {
        setSaveMessage('⚠️ SUBMISSION FAILED: Error processing your form. Please contact Alcor immediately at info@alcor.org or call 480-905-1906 to report this procedure.');
        setTimeout(() => setSaveMessage(''), 10000);
        setIsSaving(false);
      };
      
      reader.readAsDataURL(pdfBlob);
      
    } catch (error) {
      console.error('Error submitting:', error);
      setSaveMessage('⚠️ SUBMISSION FAILED: Unable to submit your procedure form. Please contact Alcor immediately at info@alcor.org or call 480-905-1906 to report this procedure.');
      setTimeout(() => setSaveMessage(''), 10000);
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

  // Container classes that change based on wider setting - matching FormsTab
  const containerClasses = wider 
    ? "procedure-tab w-full -mx-10"
    : "procedure-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4";

  return (
    <div className={containerClasses}>
      {/* Small top padding - matching FormsTab */}
      <div className="h-8"></div>
      
      {showSuccess ? (
        <ProcedureSuccessView
          wider={wider}
          submittedPoaStatus={submittedPoaStatus}
          handleDownloadSubmission={handleDownloadSubmission}
          handleViewMemberFiles={handleViewMemberFiles}
          alcorStar={alcorStar}
        />
      ) : (
        <ProcedureFormView
          wider={wider}
          formData={formData}
          handleInputChange={handleInputChange}
          handleBlur={handleBlur}
          isFieldInvalid={isFieldInvalid}
          handleSubmit={handleSubmit}
          isSaving={isSaving}
          saveMessage={saveMessage}
          showTooltip={showTooltip}
          setShowTooltip={setShowTooltip}
          alcorStar={alcorStar}
        />
      )}
    </div>
  );
};

export default ProcedureTab;