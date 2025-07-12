import React, { useState, useEffect } from 'react';
import { X, Download, Search, User, Loader2 } from 'lucide-react';
import { memberDataService } from '../portal/services/memberDataService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StaffMemberViewer = ({ isOpen, onClose, initialContactId = '' }) => {
  const [salesforceId, setSalesforceId] = useState(initialContactId);
  const [searchInput, setSearchInput] = useState(initialContactId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState(null);

  // Reset when modal opens with a new ID
  useEffect(() => {
    if (isOpen && initialContactId) {
      setSalesforceId(initialContactId);
      setSearchInput(initialContactId);
      handleSearch(initialContactId);
    }
  }, [isOpen, initialContactId]);

  const handleSearch = async (idToSearch = searchInput) => {
    if (!idToSearch.trim()) {
      setError('Please enter a Salesforce Contact ID');
      return;
    }

    setLoading(true);
    setError('');
    setMemberData(null);

    try {
      // Clear any existing cache for this contact
      memberDataService.clearCache(idToSearch);

      // Fetch all member data in parallel
      const [
        personalRes,
        contactRes,
        addressRes,
        familyRes,
        occupationRes,
        medicalRes,
        cryoRes,
        legalRes,
        emergencyRes,
        fundingRes
      ] = await Promise.allSettled([
        memberDataService.getPersonalInfo(idToSearch),
        memberDataService.getContactInfo(idToSearch),
        memberDataService.getAddresses(idToSearch),
        memberDataService.getFamilyInfo(idToSearch),
        memberDataService.getOccupation(idToSearch),
        memberDataService.getMedicalInfo(idToSearch),
        memberDataService.getCryoArrangements(idToSearch),
        memberDataService.getLegalInfo(idToSearch),
        memberDataService.getEmergencyContacts(idToSearch),
        memberDataService.getFundingInfo(idToSearch)
      ]);

      // Process results
      const processResult = (result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          return result.value.data?.data || result.value.data || {};
        }
        return {};
      };

      const data = {
        personal: processResult(personalRes),
        contact: processResult(contactRes),
        addresses: processResult(addressRes),
        family: processResult(familyRes),
        occupation: processResult(occupationRes),
        medical: processResult(medicalRes),
        cryo: processResult(cryoRes),
        legal: processResult(legalRes),
        emergency: processResult(emergencyRes),
        funding: processResult(fundingRes)
      };

      // Process emergency contacts
      if (data.emergency) {
        const nextOfKinArray = data.emergency?.nextOfKin || data.emergency || [];
        data.emergencyContacts = Array.isArray(nextOfKinArray) ? nextOfKinArray : [];
      }

      setMemberData(data);
      setSalesforceId(idToSearch);
    } catch (err) {
      console.error('Error fetching member data:', err);
      setError('Failed to fetch member data. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('member-info-content');
    if (!element) return;

    try {
      // Create a clone of the element to modify for PDF
      const clone = element.cloneNode(true);
      clone.style.padding = '40px';
      clone.style.backgroundColor = 'white';
      clone.style.color = 'black';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(clone);

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const memberName = memberData?.personal?.firstName && memberData?.personal?.lastName
        ? `${memberData.personal.firstName}_${memberData.personal.lastName}`
        : 'Member';
      
      pdf.save(`${memberName}_Info_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">View Member Information</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter Salesforce Contact ID (e.g., 003...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={loading || !searchInput.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!memberData && !loading && (
              <div className="text-center py-12 text-gray-500">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Enter a Salesforce Contact ID to view member information</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">Loading member information...</p>
              </div>
            )}

            {memberData && !loading && (
              <div id="member-info-content" className="space-y-8 bg-white">
                {/* Contact Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Name</label>
                      <p className="font-medium">
                        {memberData.personal?.firstName} {memberData.personal?.middleName} {memberData.personal?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Date of Birth</label>
                      <p className="font-medium">{formatDate(memberData.personal?.dateOfBirth)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Personal Email</label>
                      <p className="font-medium">{memberData.contact?.personalEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Work Email</label>
                      <p className="font-medium">{memberData.contact?.workEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Mobile Phone</label>
                      <p className="font-medium">{formatPhone(memberData.contact?.mobilePhone)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Home Phone</label>
                      <p className="font-medium">{formatPhone(memberData.contact?.homePhone)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Work Phone</label>
                      <p className="font-medium">{formatPhone(memberData.contact?.workPhone)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Preferred Phone</label>
                      <p className="font-medium">{memberData.contact?.preferredPhone || 'N/A'}</p>
                    </div>
                  </div>
                </section>

                {/* Personal Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Gender</label>
                      <p className="font-medium">{memberData.personal?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Marital Status</label>
                      <p className="font-medium">{memberData.personal?.maritalStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">SSN</label>
                      <p className="font-medium">{memberData.personal?.ssn || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Member ID</label>
                      <p className="font-medium">{memberData.personal?.alcorId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Ethnicity</label>
                      <p className="font-medium">{memberData.personal?.ethnicity || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Citizenship</label>
                      <p className="font-medium">{memberData.personal?.citizenship || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Place of Birth</label>
                      <p className="font-medium">{memberData.personal?.placeOfBirth || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Has Agreement</label>
                      <p className="font-medium">{memberData.personal?.hasAgreement || 'N/A'}</p>
                    </div>
                  </div>
                </section>

                {/* Addresses */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Addresses</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Home Address</h4>
                      <p>{memberData.addresses?.homeAddress?.street || 'N/A'}</p>
                      <p>
                        {memberData.addresses?.homeAddress?.city}, {memberData.addresses?.homeAddress?.state} {memberData.addresses?.homeAddress?.postalCode}
                      </p>
                      <p>{memberData.addresses?.homeAddress?.country}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Mailing Address</h4>
                      <p>{memberData.addresses?.mailingAddress?.street || 'N/A'}</p>
                      <p>
                        {memberData.addresses?.mailingAddress?.city}, {memberData.addresses?.mailingAddress?.state} {memberData.addresses?.mailingAddress?.postalCode}
                      </p>
                      <p>{memberData.addresses?.mailingAddress?.country}</p>
                    </div>
                  </div>
                </section>

                {/* Family Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Family Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Father's Name</label>
                      <p className="font-medium">{memberData.family?.fatherName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Father's Birthplace</label>
                      <p className="font-medium">{memberData.family?.fatherBirthplace || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Mother's Maiden Name</label>
                      <p className="font-medium">{memberData.family?.motherMaidenName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Mother's Birthplace</label>
                      <p className="font-medium">{memberData.family?.motherBirthplace || 'N/A'}</p>
                    </div>
                    {memberData.family?.spouseName && (
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600">Spouse's Name</label>
                        <p className="font-medium">{memberData.family.spouseName}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Occupation */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Occupation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Occupation</label>
                      <p className="font-medium">{memberData.occupation?.occupation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Industry</label>
                      <p className="font-medium">{memberData.occupation?.industry || 'N/A'}</p>
                    </div>
                    {memberData.occupation?.militaryService && (
                      <>
                        <div>
                          <label className="text-sm text-gray-600">Military Branch</label>
                          <p className="font-medium">{memberData.occupation.militaryService.branch || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Service Years</label>
                          <p className="font-medium">
                            {memberData.occupation.militaryService.startYear || 'N/A'} - {memberData.occupation.militaryService.endYear || 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Medical Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Medical Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Primary Physician</label>
                      <p className="font-medium">{memberData.medical?.primaryPhysician || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Physician Phone</label>
                      <p className="font-medium">{formatPhone(memberData.medical?.physicianPhone)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Blood Type</label>
                      <p className="font-medium">{memberData.medical?.bloodType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Smoker</label>
                      <p className="font-medium">{memberData.medical?.smoker || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Allergies</label>
                      <p className="font-medium">{memberData.medical?.allergies || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Medical Conditions</label>
                      <p className="font-medium">{memberData.medical?.conditions || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Medications</label>
                      <p className="font-medium">{memberData.medical?.medications || 'N/A'}</p>
                    </div>
                  </div>
                </section>

                {/* Cryopreservation Arrangements */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Cryopreservation Arrangements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Method of Preservation</label>
                      <p className="font-medium">{memberData.cryo?.methodOfPreservation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Contract Date</label>
                      <p className="font-medium">{formatDate(memberData.cryo?.contractDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Member Join Date</label>
                      <p className="font-medium">{formatDate(memberData.cryo?.memberJoinDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Funding Status</label>
                      <p className="font-medium">{memberData.cryo?.fundingStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">CMS Waiver</label>
                      <p className="font-medium">{memberData.cryo?.cmsWaiver || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Contract Complete</label>
                      <p className="font-medium">{memberData.cryo?.contractComplete ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Non-Cryo Remain Arrangements</label>
                      <p className="font-medium">{memberData.cryo?.nonCryoRemainArrangements || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Public Disclosure</label>
                      <p className="font-medium">{memberData.cryo?.cryopreservationDisclosure || 'N/A'}</p>
                    </div>
                    
                    {/* Recipient Information */}
                    {memberData.cryo?.recipientName && (
                      <>
                        <div className="col-span-2 mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Recipient Information</h4>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Recipient Name</label>
                          <p className="font-medium">{memberData.cryo.recipientName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Recipient Phone</label>
                          <p className="font-medium">{formatPhone(memberData.cryo.recipientPhone)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Recipient Email</label>
                          <p className="font-medium">{memberData.cryo.recipientEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Recipient Address</label>
                          <p className="font-medium">
                            {memberData.cryo.recipientMailingStreet || 'N/A'}<br />
                            {memberData.cryo.recipientMailingCity}, {memberData.cryo.recipientMailingState} {memberData.cryo.recipientMailingPostalCode}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Funding/Life Insurance */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Funding Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Funding Type</label>
                      <p className="font-medium">{memberData.funding?.fundingType || 'N/A'}</p>
                    </div>
                    {memberData.funding?.fundingType === 'Life Insurance' && (
                      <>
                        <div>
                          <label className="text-sm text-gray-600">Insurance Company</label>
                          <p className="font-medium">{memberData.funding?.companyName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Policy Number</label>
                          <p className="font-medium">{memberData.funding?.policyNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Policy Type</label>
                          <p className="font-medium">{memberData.funding?.policyType || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Face Amount</label>
                          <p className="font-medium">{formatCurrency(memberData.funding?.faceAmount)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Annual Premium</label>
                          <p className="font-medium">{formatCurrency(memberData.funding?.annualPremium)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Date Issued</label>
                          <p className="font-medium">{formatDate(memberData.funding?.dateIssued)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Term Length</label>
                          <p className="font-medium">{memberData.funding?.termLength || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Legal Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Legal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Has Will</label>
                      <p className="font-medium">{memberData.legal?.hasWill || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Will Contrary to Cryonics</label>
                      <p className="font-medium">{memberData.legal?.willContraryToCryonics || 'N/A'}</p>
                    </div>
                  </div>
                </section>

                {/* Emergency Contacts / Next of Kin */}
                {memberData.emergencyContacts && memberData.emergencyContacts.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Emergency Contacts / Next of Kin</h3>
                    <div className="space-y-4">
                      {memberData.emergencyContacts.map((contact, index) => (
                        <div key={contact.id || index} className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-3">Emergency Contact {index + 1}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-600">Name</label>
                              <p className="font-medium">
                                {contact.firstName} {contact.middleName} {contact.lastName}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Relationship</label>
                              <p className="font-medium">{contact.relationship || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Date of Birth</label>
                              <p className="font-medium">{formatDate(contact.dateOfBirth)}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Mobile Phone</label>
                              <p className="font-medium">{formatPhone(contact.mobilePhone)}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Home Phone</label>
                              <p className="font-medium">{formatPhone(contact.homePhone)}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Email</label>
                              <p className="font-medium">{contact.email || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm text-gray-600">Address</label>
                              <p className="font-medium">
                                {contact.address?.street1 || 'N/A'}<br />
                                {contact.address?.street2 && <>{contact.address.street2}<br /></>}
                                {contact.address?.city}, {contact.address?.state} {contact.address?.postalCode}<br />
                                {contact.address?.country}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Willing to Sign Affidavit</label>
                              <p className="font-medium">{contact.willingToSignAffidavit || 'N/A'}</p>
                            </div>
                            {contact.comments && (
                              <div className="col-span-2">
                                <label className="text-sm text-gray-600">Comments</label>
                                <p className="font-medium">{contact.comments}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer with Download Button */}
          {memberData && (
            <div className="border-t p-6 bg-gray-50">
              <button
                onClick={downloadPDF}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffMemberViewer;