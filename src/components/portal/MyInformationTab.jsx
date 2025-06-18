import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { memberDataService } from './services/memberDataService';
import { 
  updateMemberPersonalInfo,
  updateMemberContactInfo,
  updateMemberAddresses,
  updateMemberFamilyInfo,
  updateMemberOccupation,
  updateMemberMedicalInfo,
  updateMemberCryoArrangements,
  updateMemberLegalInfo,
  createMemberEmergencyContact,
  updateMemberEmergencyContact,
  deleteMemberEmergencyContact,
  createMemberInsurance
} from './services/salesforce/memberInfo';

const MyInformationTab = () => {
  const { salesforceContactId } = useMemberPortal();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState('');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  
  // Edit mode states for each section
  const [editMode, setEditMode] = useState({
    personal: false,
    contact: false,
    addresses: false,
    family: false,
    occupation: false,
    medical: false,
    cryoArrangements: false,
    funding: false,
    legal: false,
    membership: false,
    nextOfKin: false,
    emergency: false
  });
  
  // Data states - current values
  const [personalInfo, setPersonalInfo] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [addresses, setAddresses] = useState({});
  const [familyInfo, setFamilyInfo] = useState({});
  const [occupation, setOccupation] = useState({});
  const [medicalInfo, setMedicalInfo] = useState({});
  const [cryoArrangements, setCryoArrangements] = useState({});
  const [funding, setFunding] = useState({});
  const [legal, setLegal] = useState({});
  const [membership, setMembership] = useState({});
  const [nextOfKin, setNextOfKin] = useState({});
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  
  // Original data states - to track changes
  const [originalData, setOriginalData] = useState({
    personal: {},
    contact: {},
    addresses: {},
    family: {},
    occupation: {},
    medical: {},
    cryoArrangements: {},
    funding: {},
    legal: {},
    membership: {},
    nextOfKin: {}
  });
  
  // Load all data on mount
  useEffect(() => {
    if (salesforceContactId) {
      loadAllData();
    }
  }, [salesforceContactId]);
  
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Clear cache first to ensure fresh data
      memberDataService.clearCache(salesforceContactId);
      
      // Fetch all data in parallel
      const [
        personalRes,
        contactRes,
        addressRes,
        familyRes,
        occupationRes,
        medicalRes,
        emergencyRes
      ] = await Promise.allSettled([
        memberDataService.getPersonalInfo(salesforceContactId),
        memberDataService.getContactInfo(salesforceContactId),
        memberDataService.getAddresses(salesforceContactId),
        memberDataService.getFamilyInfo(salesforceContactId),
        memberDataService.getOccupation(salesforceContactId),
        memberDataService.getMedicalInfo(salesforceContactId),
        memberDataService.getEmergencyContacts(salesforceContactId)
      ]);
      
      // Process results from Promise.allSettled
      const results = {
        personalRes: personalRes.status === 'fulfilled' ? personalRes.value : { success: false },
        contactRes: contactRes.status === 'fulfilled' ? contactRes.value : { success: false },
        addressRes: addressRes.status === 'fulfilled' ? addressRes.value : { success: false },
        familyRes: familyRes.status === 'fulfilled' ? familyRes.value : { success: false },
        occupationRes: occupationRes.status === 'fulfilled' ? occupationRes.value : { success: false },
        medicalRes: medicalRes.status === 'fulfilled' ? medicalRes.value : { success: false },
        emergencyRes: emergencyRes.status === 'fulfilled' ? emergencyRes.value : { success: false }
      };
      
      // Update states with fetched data
      console.log('API Responses:', results);
      
      if (results.personalRes.success && results.personalRes.data) {
        const personalData = results.personalRes.data.data || results.personalRes.data;
        console.log('Setting personal info data:', personalData);
        setPersonalInfo(personalData);
        setOriginalData(prev => ({ ...prev, personal: personalData }));
      }
      if (results.contactRes.success && results.contactRes.data) {
        const contactData = results.contactRes.data.data || results.contactRes.data;
        console.log('Setting contact info data:', contactData);
        setContactInfo(contactData);
        setOriginalData(prev => ({ ...prev, contact: contactData }));
      }
      if (results.addressRes.success && results.addressRes.data) {
        const addressData = results.addressRes.data.data || results.addressRes.data;
        console.log('Setting addresses data:', addressData);
        // Transform address data to match component expectations
        const transformedAddresses = {
          homeStreet: addressData.homeAddress?.street || '',
          homeCity: addressData.homeAddress?.city || '',
          homeState: addressData.homeAddress?.state || '',
          homePostalCode: addressData.homeAddress?.postalCode || '',
          homeCountry: addressData.homeAddress?.country || '',
          mailingStreet: addressData.mailingAddress?.street || '',
          mailingCity: addressData.mailingAddress?.city || '',
          mailingState: addressData.mailingAddress?.state || '',
          mailingPostalCode: addressData.mailingAddress?.postalCode || '',
          mailingCountry: addressData.mailingAddress?.country || '',
          sameAsHome: false // Initialize as false
        };
        setAddresses(transformedAddresses);
        setOriginalData(prev => ({ ...prev, addresses: transformedAddresses }));
      }
      if (results.familyRes.success && results.familyRes.data) {
        const familyData = results.familyRes.data.data || results.familyRes.data;
        console.log('Setting family info data:', familyData);
        // Transform family data to match component expectations
        const transformedFamily = {
          fathersName: familyData.fatherName || '',
          fathersBirthplace: familyData.fatherBirthplace || '',
          mothersMaidenName: familyData.motherMaidenName || '',
          mothersBirthplace: familyData.motherBirthplace || '',
          spousesName: familyData.spouseName || ''
        };
        setFamilyInfo(transformedFamily);
        setOriginalData(prev => ({ ...prev, family: transformedFamily }));
      }
      if (results.occupationRes.success && results.occupationRes.data) {
        const occupationData = results.occupationRes.data.data || results.occupationRes.data;
        console.log('Setting occupation data:', occupationData);
        setOccupation(occupationData);
        setOriginalData(prev => ({ ...prev, occupation: occupationData }));
      }
      if (results.medicalRes.success && results.medicalRes.data) {
        const medicalData = results.medicalRes.data.data || results.medicalRes.data;
        console.log('Setting medical info data:', medicalData);
        setMedicalInfo(medicalData);
        setOriginalData(prev => ({ ...prev, medical: medicalData }));
      }
      if (results.emergencyRes.success && results.emergencyRes.data) {
        const emergencyData = results.emergencyRes.data.data || results.emergencyRes.data;
        console.log('Setting emergency contacts data:', emergencyData);
        setEmergencyContacts(emergencyData);
      } else {
        // Don't let emergency contacts failure break everything
        setEmergencyContacts([]);
      }
      
    } catch (error) {
      console.error('Error loading member data:', error);
      setSaveMessage({ type: 'error', text: 'Failed to load some information' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle edit mode for a section
  const toggleEditMode = (section) => {
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Cancel edit mode and restore original data
  const cancelEdit = (section) => {
    switch (section) {
      case 'personal':
        setPersonalInfo(originalData.personal);
        break;
      case 'contact':
        setContactInfo(originalData.contact);
        break;
      case 'addresses':
        setAddresses(originalData.addresses);
        break;
      case 'family':
        setFamilyInfo(originalData.family);
        break;
      case 'occupation':
        setOccupation(originalData.occupation);
        break;
      case 'medical':
        setMedicalInfo(originalData.medical);
        break;
      case 'cryoArrangements':
        setCryoArrangements(originalData.cryoArrangements);
        break;
      case 'funding':
        setFunding(originalData.funding);
        break;
      case 'legal':
        setLegal(originalData.legal);
        break;
      case 'membership':
        setMembership(originalData.membership);
        break;
      case 'nextOfKin':
        setNextOfKin(originalData.nextOfKin);
        break;
      case 'emergency':
        // Handle emergency contacts separately since it's an array
        break;
    }
    setEditMode(prev => ({ ...prev, [section]: false }));
  };
  
  // Helper functions for emergency contacts
  const handleAddEmergencyContact = () => {
    setEmergencyContacts([...emergencyContacts, { id: Date.now(), name: '', relationship: '', phone: '', email: '', isNew: true }]);
  };
  
  const handleDeleteEmergencyContact = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this emergency contact?')) {
      try {
        const contact = emergencyContacts.find(c => c.id === contactId);
        if (!contact.isNew) {
          await deleteMemberEmergencyContact(salesforceContactId, contactId);
        }
        setEmergencyContacts(emergencyContacts.filter(c => c.id !== contactId));
      } catch (error) {
        console.error('Error deleting emergency contact:', error);
        setSaveMessage({ type: 'error', text: 'Failed to delete emergency contact' });
      }
    }
  };
  
  const handleSaveEmergencyContact = async (contact) => {
    try {
      const result = await createMemberEmergencyContact(salesforceContactId, contact);
      if (result.success) {
        // Update the contact with the returned ID
        const updated = emergencyContacts.map(c => 
          c.id === contact.id ? { ...c, id: result.data.id, isNew: false } : c
        );
        setEmergencyContacts(updated);
        return result;
      }
      return result;
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      throw error;
    }
  };
  
  // Save individual sections
  const savePersonalInfo = async () => {
    setSavingSection('personal');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Transform data to match backend expectations
      const dataToSend = {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth,
        birthName: personalInfo.birthName,
        ssn: personalInfo.ssn,
        gender: personalInfo.gender,
        race: personalInfo.race || [],
        ethnicity: personalInfo.ethnicity,
        citizenship: personalInfo.citizenship || [],
        placeOfBirth: personalInfo.placeOfBirth,
        maritalStatus: personalInfo.maritalStatus,
        spouseName: familyInfo.spousesName // This comes from family info
      };
      
      const result = await updateMemberPersonalInfo(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Personal information saved successfully!' });
        setOriginalData(prev => ({ ...prev, personal: personalInfo }));
        setEditMode(prev => ({ ...prev, personal: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save personal information' });
      }
    } catch (error) {
      console.error('Error saving personal info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save personal information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveContactInfo = async () => {
    setSavingSection('contact');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Transform data to match backend expectations
      const dataToSend = {
        email: contactInfo.personalEmail, // Primary email
        personalEmail: contactInfo.personalEmail,
        workEmail: contactInfo.workEmail,
        homePhone: contactInfo.homePhone,
        mobilePhone: contactInfo.mobilePhone,
        workPhone: contactInfo.workPhone,
        preferredPhone: contactInfo.preferredPhone
      };
      
      const result = await updateMemberContactInfo(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Contact information saved successfully!' });
        setOriginalData(prev => ({ ...prev, contact: contactInfo }));
        setEditMode(prev => ({ ...prev, contact: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save contact information' });
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save contact information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveAddresses = async () => {
    setSavingSection('addresses');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Transform data to match backend expectations
      const dataToSend = {
        homeAddress: {
          street: addresses.homeStreet,
          city: addresses.homeCity,
          state: addresses.homeState,
          postalCode: addresses.homePostalCode,
          country: addresses.homeCountry
        },
        mailingAddress: {
          street: addresses.mailingStreet,
          city: addresses.mailingCity,
          state: addresses.mailingState,
          postalCode: addresses.mailingPostalCode,
          country: addresses.mailingCountry
        },
        sameAsHome: addresses.sameAsHome
      };
      
      const result = await updateMemberAddresses(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Addresses saved successfully!' });
        setOriginalData(prev => ({ ...prev, addresses: addresses }));
        setEditMode(prev => ({ ...prev, addresses: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save addresses' });
      }
    } catch (error) {
      console.error('Error saving addresses:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save addresses' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveFamilyInfo = async () => {
    setSavingSection('family');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Transform data to match backend expectations
      const dataToSend = {
        fatherName: familyInfo.fathersName,
        fatherBirthplace: familyInfo.fathersBirthplace,
        motherMaidenName: familyInfo.mothersMaidenName,
        motherBirthplace: familyInfo.mothersBirthplace
      };
      
      const result = await updateMemberFamilyInfo(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Family information saved successfully!' });
        setOriginalData(prev => ({ ...prev, family: familyInfo }));
        setEditMode(prev => ({ ...prev, family: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save family information' });
      }
    } catch (error) {
      console.error('Error saving family info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save family information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveOccupation = async () => {
    setSavingSection('occupation');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Transform data to match backend expectations
      const dataToSend = {
        occupation: occupation.occupation,
        industry: occupation.occupationalIndustry,
        militaryService: occupation.hasMilitaryService ? {
          branch: occupation.militaryBranch,
          startYear: occupation.servedFrom,
          endYear: occupation.servedTo
        } : null
      };
      
      const result = await updateMemberOccupation(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Occupation saved successfully!' });
        setOriginalData(prev => ({ ...prev, occupation: occupation }));
        setEditMode(prev => ({ ...prev, occupation: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save occupation' });
      }
    } catch (error) {
      console.error('Error saving occupation:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save occupation' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveMedicalInfo = async () => {
    setSavingSection('medical');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const result = await updateMemberMedicalInfo(salesforceContactId, medicalInfo);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Medical information saved successfully!' });
        setOriginalData(prev => ({ ...prev, medical: medicalInfo }));
        setEditMode(prev => ({ ...prev, medical: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save medical information' });
      }
    } catch (error) {
      console.error('Error saving medical info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save medical information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  // Save functions for new sections
  const saveCryoArrangements = async () => {
    setSavingSection('cryoArrangements');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const result = await updateMemberCryoArrangements(salesforceContactId, cryoArrangements);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Cryopreservation arrangements saved successfully!' });
        setOriginalData(prev => ({ ...prev, cryoArrangements: cryoArrangements }));
        setEditMode(prev => ({ ...prev, cryoArrangements: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save cryopreservation arrangements' });
      }
    } catch (error) {
      console.error('Error saving cryo arrangements:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save cryopreservation arrangements' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  const saveFunding = async () => {
    setSavingSection('funding');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // For insurance, we need to create or update the insurance record
      if (funding.fundingType === 'LifeInsurance') {
        const insuranceData = {
          companyName: funding.companyName,
          policyNumber: funding.policyNumber,
          policyType: funding.policyType,
          faceAmount: funding.faceAmount,
          // Add other insurance fields as needed
        };
        
        // This would need a create or update API
        const result = await createMemberInsurance(salesforceContactId, insuranceData);
        if (result.success) {
          setSaveMessage({ type: 'success', text: 'Insurance information saved successfully!' });
          setOriginalData(prev => ({ ...prev, funding: funding }));
          setEditMode(prev => ({ ...prev, funding: false }));
        } else {
          setSaveMessage({ type: 'error', text: 'Failed to save insurance information' });
        }
      }
    } catch (error) {
      console.error('Error saving funding:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save funding information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  const saveLegal = async () => {
    setSavingSection('legal');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const dataToSend = {
        hasWill: legal.hasWill === 'Yes',
        willContraryToCryonics: legal.contraryProvisions === 'Yes'
      };
      
      const result = await updateMemberLegalInfo(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Legal information saved successfully!' });
        setOriginalData(prev => ({ ...prev, legal: legal }));
        setEditMode(prev => ({ ...prev, legal: false }));
        memberDataService.clearCache(salesforceContactId);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save legal information' });
      }
    } catch (error) {
      console.error('Error saving legal info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save legal information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  const saveMembership = async () => {
    setSavingSection('membership');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Membership options might be part of agreement or contact record
      // This would need specific API endpoints
      setSaveMessage({ type: 'info', text: 'Membership options update not yet implemented' });
    } catch (error) {
      console.error('Error saving membership:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save membership options' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  const saveNextOfKin = async () => {
    setSavingSection('nextOfKin');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const nokData = {
        name: nextOfKin.fullName,
        relationship: nextOfKin.relationship,
        phone: nextOfKin.phone,
        email: nextOfKin.email,
        address: {
          street: nextOfKin.address,
          // You might want to split address into components
        },
        isPrimary: true
      };
      
      const result = await createMemberEmergencyContact(salesforceContactId, nokData);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Next of kin saved successfully!' });
        setOriginalData(prev => ({ ...prev, nextOfKin: nextOfKin }));
        setEditMode(prev => ({ ...prev, nextOfKin: false }));
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save next of kin' });
      }
    } catch (error) {
      console.error('Error saving next of kin:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save next of kin' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  const saveEmergencyContacts = async () => {
    setSavingSection('emergency');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Save all emergency contacts
      const savePromises = emergencyContacts.map(contact => {
        if (contact.isNew) {
          return handleSaveEmergencyContact(contact);
        } else {
          return updateMemberEmergencyContact(salesforceContactId, contact.id, contact);
        }
      });
      
      await Promise.all(savePromises);
      setSaveMessage({ type: 'success', text: 'Emergency contacts saved successfully!' });
      setEditMode(prev => ({ ...prev, emergency: false }));
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save emergency contacts' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">My Information</h1>
      
      {/* Save Message */}
      {saveMessage.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {saveMessage.text}
        </div>
      )}
      
      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Personal Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">First Name</label>
            <input 
              type="text" 
              value={personalInfo.firstName || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Last Name</label>
            <input 
              type="text" 
              value={personalInfo.lastName || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Date of Birth</label>
            <input 
              type="date" 
              value={personalInfo.dateOfBirth || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, dateOfBirth: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Verify Date of Birth</label>
            <input 
              type="date" 
              value={personalInfo.verifyDateOfBirth || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, verifyDateOfBirth: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">
              <input 
                type="checkbox" 
                checked={personalInfo.hasDifferentBirthName || false} 
                onChange={(e) => setPersonalInfo({...personalInfo, hasDifferentBirthName: e.target.checked})}
                disabled={!editMode.personal}
                className="mr-2" 
              />
              Is your birth name different from your current name?
            </label>
          </div>
          {personalInfo.hasDifferentBirthName && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Birth Name</label>
              <input 
                type="text" 
                value={personalInfo.birthName || ''} 
                onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                disabled={!editMode.personal}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Social Security Number</label>
            <input 
              type="text" 
              value={personalInfo.ssn || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, ssn: e.target.value})}
              disabled={!editMode.personal}
              placeholder="XXX-XX-XXXX" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Gender</label>
            <select 
              value={personalInfo.gender || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Race</label>
            <select 
              multiple
              value={personalInfo.race || []} 
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setPersonalInfo({...personalInfo, race: selected});
              }}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
              <option value="Asian">Asian</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
              <option value="White">White</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Ethnicity</label>
            <select 
              value={personalInfo.ethnicity || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, ethnicity: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Citizenship</label>
            <select 
              multiple
              value={personalInfo.citizenship || []} 
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setPersonalInfo({...personalInfo, citizenship: selected});
              }}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Place of Birth</label>
            <input 
              type="text" 
              value={personalInfo.placeOfBirth || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, placeOfBirth: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Marital Status</label>
            <select 
              value={personalInfo.maritalStatus || ''} 
              onChange={(e) => setPersonalInfo({...personalInfo, maritalStatus: e.target.value})}
              disabled={!editMode.personal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.personal ? (
            <>
              <button
                onClick={() => cancelEdit('personal')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={savePersonalInfo}
                disabled={savingSection === 'personal'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'personal' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('personal')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Contact Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Personal Email</label>
            <input 
              type="email" 
              value={contactInfo.personalEmail || ''} 
              onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
              disabled={!editMode.contact}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Work Email</label>
            <input 
              type="email" 
              value={contactInfo.workEmail || ''} 
              onChange={(e) => setContactInfo({...contactInfo, workEmail: e.target.value})}
              disabled={!editMode.contact}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Mobile Phone</label>
            <input 
              type="tel" 
              value={contactInfo.mobilePhone || ''} 
              onChange={(e) => setContactInfo({...contactInfo, mobilePhone: e.target.value})}
              disabled={!editMode.contact}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Home Phone</label>
            <input 
              type="tel" 
              value={contactInfo.homePhone || ''} 
              onChange={(e) => setContactInfo({...contactInfo, homePhone: e.target.value})}
              disabled={!editMode.contact}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Work Phone</label>
            <input 
              type="tel" 
              value={contactInfo.workPhone || ''} 
              onChange={(e) => setContactInfo({...contactInfo, workPhone: e.target.value})}
              disabled={!editMode.contact}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Preferred Phone</label>
            <select 
              value={contactInfo.preferredPhone || ''} 
              onChange={(e) => setContactInfo({...contactInfo, preferredPhone: e.target.value})}
              disabled={!editMode.contact}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="Mobile">Mobile Phone</option>
              <option value="Home">Home Phone</option>
              <option value="Work">Work Phone</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.contact ? (
            <>
              <button
                onClick={() => cancelEdit('contact')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveContactInfo}
                disabled={savingSection === 'contact'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'contact' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('contact')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Addresses</h2>
        
        {/* Home Address */}
        <div className="mb-6">
          <h3 className="font-medium text-[#2a2346] mb-4">Home Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Street Address</label>
              <input 
                type="text" 
                value={addresses.homeStreet || ''} 
                onChange={(e) => setAddresses({...addresses, homeStreet: e.target.value})}
                disabled={!editMode.addresses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">City</label>
              <input 
                type="text" 
                value={addresses.homeCity || ''} 
                onChange={(e) => setAddresses({...addresses, homeCity: e.target.value})}
                disabled={!editMode.addresses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">State/Province</label>
              <input 
                type="text" 
                value={addresses.homeState || ''} 
                onChange={(e) => setAddresses({...addresses, homeState: e.target.value})}
                disabled={!editMode.addresses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Zip/Postal Code</label>
              <input 
                type="text" 
                value={addresses.homePostalCode || ''} 
                onChange={(e) => setAddresses({...addresses, homePostalCode: e.target.value})}
                disabled={!editMode.addresses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Country</label>
              <input 
                type="text" 
                value={addresses.homeCountry || ''} 
                onChange={(e) => setAddresses({...addresses, homeCountry: e.target.value})}
                disabled={!editMode.addresses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
          </div>
        </div>

        {/* Mailing Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#4a3d6b] mb-4">
            <input 
              type="checkbox" 
              checked={addresses.sameAsHome || false} 
              onChange={(e) => setAddresses({...addresses, sameAsHome: e.target.checked})}
              disabled={!editMode.addresses}
              className="mr-2" 
            />
            Mailing address is the same as home address
          </label>
          
          {!addresses.sameAsHome && (
            <>
              <h3 className="font-medium text-[#2a2346] mb-4">Mailing Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Street Address</label>
                  <input 
                    type="text" 
                    value={addresses.mailingStreet || ''} 
                    onChange={(e) => setAddresses({...addresses, mailingStreet: e.target.value})}
                    disabled={!editMode.addresses}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">City</label>
                  <input 
                    type="text" 
                    value={addresses.mailingCity || ''} 
                    onChange={(e) => setAddresses({...addresses, mailingCity: e.target.value})}
                    disabled={!editMode.addresses}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">State/Province</label>
                  <input 
                    type="text" 
                    value={addresses.mailingState || ''} 
                    onChange={(e) => setAddresses({...addresses, mailingState: e.target.value})}
                    disabled={!editMode.addresses}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Zip/Postal Code</label>
                  <input 
                    type="text" 
                    value={addresses.mailingPostalCode || ''} 
                    onChange={(e) => setAddresses({...addresses, mailingPostalCode: e.target.value})}
                    disabled={!editMode.addresses}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Country</label>
                  <input 
                    type="text" 
                    value={addresses.mailingCountry || ''} 
                    onChange={(e) => setAddresses({...addresses, mailingCountry: e.target.value})}
                    disabled={!editMode.addresses}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.addresses ? (
            <>
              <button
                onClick={() => cancelEdit('addresses')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveAddresses}
                disabled={savingSection === 'addresses'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'addresses' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('addresses')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Family Information */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Family Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Father's Full Name</label>
            <input 
              type="text" 
              value={familyInfo.fathersName || ''} 
              onChange={(e) => setFamilyInfo({...familyInfo, fathersName: e.target.value})}
              disabled={!editMode.family}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Father's Birthplace</label>
            <input 
              type="text" 
              value={familyInfo.fathersBirthplace || ''} 
              onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
              disabled={!editMode.family}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Mother's Maiden Name</label>
            <input 
              type="text" 
              value={familyInfo.mothersMaidenName || ''} 
              onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
              disabled={!editMode.family}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Mother's Birthplace</label>
            <input 
              type="text" 
              value={familyInfo.mothersBirthplace || ''} 
              onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
              disabled={!editMode.family}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          {personalInfo.maritalStatus === 'Married' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">
                {personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
              </label>
              <input 
                type="text" 
                value={familyInfo.spousesName || ''} 
                onChange={(e) => setFamilyInfo({...familyInfo, spousesName: e.target.value})}
                disabled={!editMode.family}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
          )}
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.family ? (
            <>
              <button
                onClick={() => cancelEdit('family')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveFamilyInfo}
                disabled={savingSection === 'family'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'family' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('family')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Occupation */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Occupation</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Job Title</label>
            <input 
              type="text" 
              value={occupation.occupation || ''} 
              onChange={(e) => setOccupation({...occupation, occupation: e.target.value})}
              disabled={!editMode.occupation}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Industry</label>
            <input 
              type="text" 
              value={occupation.occupationalIndustry || ''} 
              onChange={(e) => setOccupation({...occupation, occupationalIndustry: e.target.value})}
              disabled={!editMode.occupation}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">
              <input 
                type="checkbox" 
                checked={occupation.hasMilitaryService || false} 
                onChange={(e) => setOccupation({...occupation, hasMilitaryService: e.target.checked, militaryBranch: e.target.checked ? occupation.militaryBranch : 'None'})}
                disabled={!editMode.occupation}
                className="mr-2" 
              />
              Have you served in the US Military?
            </label>
          </div>
          {occupation.hasMilitaryService && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Military Branch</label>
                <select 
                  value={occupation.militaryBranch || ''} 
                  onChange={(e) => setOccupation({...occupation, militaryBranch: e.target.value})}
                  disabled={!editMode.occupation}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
                >
                  <option value="">Select...</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                  <option value="Marines">Marines</option>
                  <option value="Coast Guard">Coast Guard</option>
                  <option value="Space Force">Space Force</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Service Start Year</label>
                <input 
                  type="number" 
                  value={occupation.servedFrom || ''} 
                  onChange={(e) => setOccupation({...occupation, servedFrom: e.target.value})}
                  disabled={!editMode.occupation}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Service End Year</label>
                <input 
                  type="number" 
                  value={occupation.servedTo || ''} 
                  onChange={(e) => setOccupation({...occupation, servedTo: e.target.value})}
                  disabled={!editMode.occupation}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.occupation ? (
            <>
              <button
                onClick={() => cancelEdit('occupation')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveOccupation}
                disabled={savingSection === 'occupation'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'occupation' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('occupation')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Medical Information</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Primary Care Physician</label>
            <input 
              type="text" 
              value={medicalInfo.primaryPhysician || ''} 
              onChange={(e) => setMedicalInfo({...medicalInfo, primaryPhysician: e.target.value})}
              disabled={!editMode.medical}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Physician Phone</label>
            <input 
              type="tel" 
              value={medicalInfo.physicianPhone || ''} 
              onChange={(e) => setMedicalInfo({...medicalInfo, physicianPhone: e.target.value})}
              disabled={!editMode.medical}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Medical Conditions</label>
            <textarea 
              value={medicalInfo.conditions || ''} 
              onChange={(e) => setMedicalInfo({...medicalInfo, conditions: e.target.value})}
              disabled={!editMode.medical}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Current Medications</label>
            <textarea 
              value={medicalInfo.medications || ''} 
              onChange={(e) => setMedicalInfo({...medicalInfo, medications: e.target.value})}
              disabled={!editMode.medical}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Allergies</label>
            <textarea 
              value={medicalInfo.allergies || ''} 
              onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
              disabled={!editMode.medical}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.medical ? (
            <>
              <button
                onClick={() => cancelEdit('medical')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveMedicalInfo}
                disabled={savingSection === 'medical'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'medical' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('medical')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Cryopreservation Arrangements */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Cryopreservation Arrangements</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Method of Cryopreservation</label>
            <select 
              value={cryoArrangements.method || ''} 
              onChange={(e) => setCryoArrangements({...cryoArrangements, method: e.target.value})}
              disabled={!editMode.cryoArrangements}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="WholeBody">Whole Body Cryopreservation ($220,000 US / $230,000 International)</option>
              <option value="Neuro">Neurocryopreservation ($80,000 US / $90,000 International)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">
              <input 
                type="checkbox" 
                checked={cryoArrangements.cmsWaiver || false} 
                onChange={(e) => setCryoArrangements({...cryoArrangements, cmsWaiver: e.target.checked})}
                disabled={!editMode.cryoArrangements}
                className="mr-2" 
              />
              Waive the $200 annual CMS fee by funding $20,000 over the minimum
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Non-Cryopreserved Remains Handling</label>
            <select 
              value={cryoArrangements.remainsHandling || ''} 
              onChange={(e) => setCryoArrangements({...cryoArrangements, remainsHandling: e.target.value})}
              disabled={!editMode.cryoArrangements}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="Return">Return to designated recipient</option>
              <option value="Donate">Donate to medical research</option>
              <option value="Cremate">Cremate and dispose</option>
            </select>
          </div>

          {cryoArrangements.remainsHandling === 'Return' && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Recipient Name</label>
                <input 
                  type="text" 
                  value={cryoArrangements.recipientName || ''} 
                  onChange={(e) => setCryoArrangements({...cryoArrangements, recipientName: e.target.value})}
                  disabled={!editMode.cryoArrangements}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Recipient Phone</label>
                <input 
                  type="tel" 
                  value={cryoArrangements.recipientPhone || ''} 
                  onChange={(e) => setCryoArrangements({...cryoArrangements, recipientPhone: e.target.value})}
                  disabled={!editMode.cryoArrangements}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Recipient Email</label>
                <input 
                  type="email" 
                  value={cryoArrangements.recipientEmail || ''} 
                  onChange={(e) => setCryoArrangements({...cryoArrangements, recipientEmail: e.target.value})}
                  disabled={!editMode.cryoArrangements}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Public Disclosure Preference</label>
            <select 
              value={cryoArrangements.publicDisclosure || ''} 
              onChange={(e) => setCryoArrangements({...cryoArrangements, publicDisclosure: e.target.value})}
              disabled={!editMode.cryoArrangements}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="Freely">Alcor is authorized to freely release information</option>
              <option value="BeforeDeath">Maintain confidentiality prior to legal death</option>
              <option value="Always">Always maintain confidentiality</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.cryoArrangements ? (
            <>
              <button
                onClick={() => cancelEdit('cryoArrangements')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCryoArrangements}
                disabled={savingSection === 'cryoArrangements'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'cryoArrangements' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('cryoArrangements')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Funding/Life Insurance */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Funding/Life Insurance</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Funding Type</label>
            <select 
              value={funding.fundingType || ''} 
              onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
              disabled={!editMode.funding}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="LifeInsurance">Life Insurance</option>
              <option value="Trust">Trust</option>
              <option value="Prepaid">Prepaid</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {funding.fundingType === 'LifeInsurance' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Insurance Company Name</label>
                  <input 
                    type="text" 
                    value={funding.companyName || ''} 
                    onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                    disabled={!editMode.funding}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Policy Number</label>
                  <input 
                    type="text" 
                    value={funding.policyNumber || ''} 
                    onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                    disabled={!editMode.funding}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Policy Type</label>
                  <select 
                    value={funding.policyType || ''} 
                    onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                    disabled={!editMode.funding}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
                  >
                    <option value="">Select...</option>
                    <option value="Term">Term</option>
                    <option value="Whole">Whole Life</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Face Amount</label>
                  <input 
                    type="number" 
                    value={funding.faceAmount || ''} 
                    onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                    disabled={!editMode.funding}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.funding ? (
            <>
              <button
                onClick={() => cancelEdit('funding')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveFunding}
                disabled={savingSection === 'funding'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'funding' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('funding')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Legal/Will */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Legal/Will Information</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Do you have a will?</label>
            <select 
              value={legal.hasWill || ''} 
              onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
              disabled={!editMode.legal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          
          {legal.hasWill === 'Yes' && (
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Does your will contain any provisions contrary to cryonics?</label>
              <select 
                value={legal.contraryProvisions || ''} 
                onChange={(e) => setLegal({...legal, contraryProvisions: e.target.value})}
                disabled={!editMode.legal}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.legal ? (
            <>
              <button
                onClick={() => cancelEdit('legal')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveLegal}
                disabled={savingSection === 'legal'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'legal' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('legal')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Next of Kin */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Next of Kin</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Relationship</label>
            <input 
              type="text" 
              value={nextOfKin.relationship || ''} 
              onChange={(e) => setNextOfKin({...nextOfKin, relationship: e.target.value})}
              disabled={!editMode.nextOfKin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Full Name</label>
            <input 
              type="text" 
              value={nextOfKin.fullName || ''} 
              onChange={(e) => setNextOfKin({...nextOfKin, fullName: e.target.value})}
              disabled={!editMode.nextOfKin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Phone Number</label>
            <input 
              type="tel" 
              value={nextOfKin.phone || ''} 
              onChange={(e) => setNextOfKin({...nextOfKin, phone: e.target.value})}
              disabled={!editMode.nextOfKin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Email</label>
            <input 
              type="email" 
              value={nextOfKin.email || ''} 
              onChange={(e) => setNextOfKin({...nextOfKin, email: e.target.value})}
              disabled={!editMode.nextOfKin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Address</label>
            <input 
              type="text" 
              value={nextOfKin.address || ''} 
              onChange={(e) => setNextOfKin({...nextOfKin, address: e.target.value})}
              disabled={!editMode.nextOfKin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.nextOfKin ? (
            <>
              <button
                onClick={() => cancelEdit('nextOfKin')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNextOfKin}
                disabled={savingSection === 'nextOfKin'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'nextOfKin' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('nextOfKin')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Emergency Contacts</h2>
        
        {emergencyContacts.map((contact, index) => (
          <div key={contact.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Name</label>
                <input 
                  type="text" 
                  value={contact.name || ''} 
                  onChange={(e) => {
                    const updated = [...emergencyContacts];
                    updated[index] = {...contact, name: e.target.value};
                    setEmergencyContacts(updated);
                  }}
                  disabled={!editMode.emergency}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Relationship</label>
                <input 
                  type="text" 
                  value={contact.relationship || ''} 
                  onChange={(e) => {
                    const updated = [...emergencyContacts];
                    updated[index] = {...contact, relationship: e.target.value};
                    setEmergencyContacts(updated);
                  }}
                  disabled={!editMode.emergency}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={contact.phone || ''} 
                  onChange={(e) => {
                    const updated = [...emergencyContacts];
                    updated[index] = {...contact, phone: e.target.value};
                    setEmergencyContacts(updated);
                  }}
                  disabled={!editMode.emergency}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Email</label>
                <input 
                  type="email" 
                  value={contact.email || ''} 
                  onChange={(e) => {
                    const updated = [...emergencyContacts];
                    updated[index] = {...contact, email: e.target.value};
                    setEmergencyContacts(updated);
                  }}
                  disabled={!editMode.emergency}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
                />
              </div>
            </div>
            {editMode.emergency && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => handleDeleteEmergencyContact(contact.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove Contact
                </button>
              </div>
            )}
          </div>
        ))}
        
        {editMode.emergency && (
          <button
            onClick={handleAddEmergencyContact}
            className="mb-4 px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
          >
            Add Emergency Contact
          </button>
        )}
        
        <div className="flex justify-end mt-6 gap-2">
          {editMode.emergency ? (
            <>
              <button
                onClick={() => cancelEdit('emergency')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEmergencyContacts}
                disabled={savingSection === 'emergency'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'emergency' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('emergency')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Membership Options */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Membership Options</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">
              <input 
                type="checkbox" 
                checked={membership.lifetimeMember || false} 
                onChange={(e) => setMembership({...membership, lifetimeMember: e.target.checked})}
                disabled={!editMode.membership}
                className="mr-2" 
              />
              Apply for lifetime membership ($1,500 one-time fee instead of annual dues)
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">ICE Discount Code (if applicable)</label>
            <input 
              type="text" 
              value={membership.iceDiscountCode || ''} 
              onChange={(e) => setMembership({...membership, iceDiscountCode: e.target.value})}
              disabled={!editMode.membership}
              placeholder="Enter code if you have one"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          {editMode.membership ? (
            <>
              <button
                onClick={() => cancelEdit('membership')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveMembership}
                disabled={savingSection === 'membership'}
                className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
              >
                {savingSection === 'membership' ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEditMode('membership')}
              className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInformationTab;