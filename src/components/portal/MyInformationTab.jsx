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
  createMemberInsurance
} from './services/salesforce/memberInfo';

// Import styled components
import { Alert, Loading } from './FormComponents';

// Import all styled section components
import PersonalInfoSection from './MyInfoSections/PersonalInfoSection';
import ContactInfoSection from './MyInfoSections/ContactInfoSection';
import AddressesSection from './MyInfoSections/AddressesSection';
import FamilyInfoSection from './MyInfoSections/FamilyInfoSection';
import OccupationSection from './MyInfoSections/OccupationSection';
import MedicalInfoSection from './MyInfoSections/MedicalInfoSection';
import CryoArrangementsSection from './MyInfoSections/CryoArrangementsSection';
import FundingSection from './MyInfoSections/FundingSection';
import LegalSection from './MyInfoSections/LegalSection';
import NextOfKinSection from './MyInfoSections/NextOfKinSection';

const MyInformationTab = () => {
  const { salesforceContactId } = useMemberPortal();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState('');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  
  // Section loading states
  const [sectionsLoaded, setSectionsLoaded] = useState({
    contact: false,
    personal: false,
    addresses: false,
    family: false,
    occupation: false,
    medical: false,
    cryoArrangements: false,
    funding: false,
    legal: false,
    nextOfKin: false
  });
  
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
    nextOfKin: false
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
  const [nextOfKin, setNextOfKin] = useState({});

  // Define separator style as a constant
  const sectionSeparator = "h-1 my-16 w-1/5 rounded-full bg-gray-400";
  
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
    nextOfKin: {}
  });
  
  // Load all data on mount
  useEffect(() => {
    if (salesforceContactId) {
      loadAllData();
    }
  }, [salesforceContactId]);
  
  // Stagger section loading after data is loaded
  useEffect(() => {
    if (!isLoading && personalInfo.firstName) {
      const timers = [];
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, contact: true }));
      }, 100));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, personal: true }));
      }, 200));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, addresses: true }));
      }, 300));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, family: true }));
      }, 400));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, occupation: true }));
      }, 500));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, medical: true }));
      }, 600));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, cryoArrangements: true }));
      }, 700));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, funding: true }));
      }, 800));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, legal: true }));
      }, 900));
      
      timers.push(setTimeout(() => {
        setSectionsLoaded(prev => ({ ...prev, nextOfKin: true }));
      }, 1000));
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isLoading, personalInfo.firstName]);
  
// Updated loadAllData function in MyInformationTab.jsx

const loadAllData = async () => {
  setIsLoading(true);
  try {
    // Clear cache first to ensure fresh data
    memberDataService.clearCache(salesforceContactId);
    
    // Fetch all data in parallel (including cryo arrangements now)
    const [
      personalRes,
      contactRes,
      addressRes,
      familyRes,
      occupationRes,
      medicalRes,
      cryoRes,        // Added
      legalRes,       // Added
      emergencyRes,   // Added
      insuranceRes    // Added
    ] = await Promise.allSettled([
      memberDataService.getPersonalInfo(salesforceContactId),
      memberDataService.getContactInfo(salesforceContactId),
      memberDataService.getAddresses(salesforceContactId),
      memberDataService.getFamilyInfo(salesforceContactId),
      memberDataService.getOccupation(salesforceContactId),
      memberDataService.getMedicalInfo(salesforceContactId),
      memberDataService.getCryoArrangements(salesforceContactId),    // Added
      memberDataService.getLegalInfo(salesforceContactId),            // Added
      memberDataService.getEmergencyContacts(salesforceContactId),    // Added
      memberDataService.getInsurance(salesforceContactId)             // Added
    ]);
    
    // Process results from Promise.allSettled
    const results = {
      personalRes: personalRes.status === 'fulfilled' ? personalRes.value : { success: false },
      contactRes: contactRes.status === 'fulfilled' ? contactRes.value : { success: false },
      addressRes: addressRes.status === 'fulfilled' ? addressRes.value : { success: false },
      familyRes: familyRes.status === 'fulfilled' ? familyRes.value : { success: false },
      occupationRes: occupationRes.status === 'fulfilled' ? occupationRes.value : { success: false },
      medicalRes: medicalRes.status === 'fulfilled' ? medicalRes.value : { success: false },
      cryoRes: cryoRes.status === 'fulfilled' ? cryoRes.value : { success: false },
      legalRes: legalRes.status === 'fulfilled' ? legalRes.value : { success: false },
      emergencyRes: emergencyRes.status === 'fulfilled' ? emergencyRes.value : { success: false },
      insuranceRes: insuranceRes.status === 'fulfilled' ? insuranceRes.value : { success: false }
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
    
    // Process Cryopreservation Arrangements
    if (results.cryoRes.success && results.cryoRes.data) {
      const cryoData = results.cryoRes.data.data || results.cryoRes.data;
      console.log('Setting cryo arrangements data:', cryoData);
      
      // Transform the backend data to match component expectations
      const transformedCryo = {
        // Map methodOfPreservation to method
        method: cryoData.methodOfPreservation?.includes('Whole Body') ? 'WholeBody' : 
                cryoData.methodOfPreservation?.includes('Neuro') ? 'Neuro' : '',
        
        // Map cmsWaiver from "Yes"/"No" to boolean
        cmsWaiver: cryoData.cmsWaiver === 'Yes',
        
        // Map remains handling based on the agreement field
        remainsHandling: mapRemainsHandling(cryoData.nonCryoRemainArrangements),
        
        // Recipient information
        recipientName: cryoData.recipientName || '',
        recipientPhone: cryoData.recipientPhone || '',
        recipientEmail: cryoData.recipientEmail || '',
        
        // Map public disclosure - use memberPublicDisclosure if available, otherwise publicDisclosure
        publicDisclosure: mapPublicDisclosure(cryoData.memberPublicDisclosure || cryoData.publicDisclosure),
        
        // Store additional fields that might be useful
        fundingStatus: cryoData.fundingStatus,
        contractDate: cryoData.contractDate,
        memberJoinDate: cryoData.memberJoinDate,
        contractComplete: cryoData.contractComplete,
        isPatient: cryoData.isPatient,
        recipientAddress: cryoData.recipientAddress
      };
      
      setCryoArrangements(transformedCryo);
      setOriginalData(prev => ({ ...prev, cryoArrangements: transformedCryo }));
    } else {
      console.log('Cryo arrangements request failed or returned no data');
    }
    
    // Process Legal Information
    if (results.legalRes.success && results.legalRes.data) {
      const legalData = results.legalRes.data.data || results.legalRes.data;
      console.log('Setting legal info data:', legalData);
      
      // Transform legal data to match component expectations
      const transformedLegal = {
        hasWill: legalData.hasWill ? 'Yes' : 'No',
        contraryProvisions: legalData.willContraryToCryonics ? 'Yes' : 'No'
      };
      
      setLegal(transformedLegal);
      setOriginalData(prev => ({ ...prev, legal: transformedLegal }));
    }
    
    // Process Emergency Contacts (Next of Kin)
    if (results.emergencyRes.success && results.emergencyRes.data) {
      const emergencyResponse = results.emergencyRes.data;
      console.log('Emergency contacts response:', emergencyResponse);
      
      // Access the data.data.nextOfKin array
      const nextOfKinArray = emergencyResponse.data?.nextOfKin || emergencyResponse.nextOfKin;
      
      if (nextOfKinArray && nextOfKinArray.length > 0) {
        const primaryContact = nextOfKinArray[0]; // Use first one
        console.log('Primary contact data:', primaryContact);
        
        const transformedNextOfKin = {
          fullName: primaryContact.fullName,
          relationship: primaryContact.relationship,
          phone: primaryContact.mobilePhone || primaryContact.homePhone || '',
          email: primaryContact.email || '',
          address: `${primaryContact.address.street}, ${primaryContact.address.city}, ${primaryContact.address.state} ${primaryContact.address.postalCode}`
        };
        
        console.log('Transformed next of kin:', transformedNextOfKin);
        setNextOfKin(transformedNextOfKin);
        setOriginalData(prev => ({ ...prev, nextOfKin: transformedNextOfKin }));
      } else {
        console.log('No next of kin data found in response');
      }
    } else {
      console.log('Emergency contacts request failed or returned no data');
    }
    
    // Process Insurance (Funding)
    if (results.insuranceRes.success && results.insuranceRes.data) {
      const insuranceData = results.insuranceRes.data.data || results.insuranceRes.data;
      console.log('Setting insurance data:', insuranceData);
      
      // If there's insurance data, use the first one for funding
      if (insuranceData.length > 0) {
        const primaryInsurance = insuranceData[0];
        const transformedFunding = {
          fundingType: 'LifeInsurance',
          companyName: primaryInsurance.companyName || '',
          policyNumber: primaryInsurance.policyNumber || '',
          policyType: primaryInsurance.policyType || '',
          faceAmount: primaryInsurance.faceAmount || ''
        };
        setFunding(transformedFunding);
        setOriginalData(prev => ({ ...prev, funding: transformedFunding }));
      }
    }
    
  } catch (error) {
    console.error('Error loading member data:', error);
    setSaveMessage({ type: 'error', text: 'Failed to load some information' });
  } finally {
    setIsLoading(false);
  }
};

      // Helper functions to map Salesforce values to component values
    function mapRemainsHandling(sfValue) {
      if (!sfValue) return '';
      
      // Map based on the Salesforce picklist values
      if (sfValue.includes('delivery of such cremated materials to a named person')) {
        return 'Return';
      } else if (sfValue.includes('research or tissue donation')) {
        return 'Donate';
      } else if (sfValue.includes('disposal or retainage')) {
        return 'Cremate';
      }
      
      return '';
    }

    function mapPublicDisclosure(sfValue) {
      if (!sfValue) return '';
      
      // Map based on the Salesforce picklist values
      if (sfValue.includes('freely release')) {
        return 'Freely';
      } else if (sfValue.includes('reasonable efforts to maintain confidentiality')) {
        return 'BeforeDeath';
      } else if (sfValue.includes('not authorized')) {
        return 'Always';
      }
      
      return '';
    }

    // Helper functions to map back to Salesforce values for saving
    function mapRemainsHandlingToSF(value) {
      switch(value) {
        case 'Return':
          return "Alcor Cremation and Disposition of Cryopreservation Member's Non-Cryopreserved Human Remains and the delivery of such cremated materials to a named person/entity.";
        case 'Donate':
          return "Alcor Cremation and Disposition of Cryopreservation Member's Non-Cryopreserved Human Remains with disposal or retainage thereof in Alcor's sole discretion, with possible use for research or tissue donation.";
        case 'Cremate':
          return "Alcor Cremation and Disposition of Cryopreservation Member's Non-Cryopreserved Human Remains with disposal or retainage thereof in Alcor's sole discretion.";
        default:
          return null;
      }
    }

    function mapPublicDisclosureToSF(value) {
      switch(value) {
        case 'Freely':
          return "Alcor is authorized to freely release Cryopreservation Member information at its discretion.";
        case 'BeforeDeath':
          return "Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor's General Terms and Conditions.";
        case 'Always':
          return "Alcor is not authorized to release Cryopreservation Member information.";
        default:
          return null;
      }
    }
  
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
        // Also restore the personal info fields that are now in contact section
        setPersonalInfo(prev => ({
          ...prev,
          firstName: originalData.personal.firstName || '',
          lastName: originalData.personal.lastName || '',
          dateOfBirth: originalData.personal.dateOfBirth || ''
        }));
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
      case 'nextOfKin':
        setNextOfKin(originalData.nextOfKin);
        break;
    }
    setEditMode(prev => ({ ...prev, [section]: false }));
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
      const contactData = {
        email: contactInfo.personalEmail, // Primary email
        personalEmail: contactInfo.personalEmail,
        workEmail: contactInfo.workEmail,
        homePhone: contactInfo.homePhone,
        mobilePhone: contactInfo.mobilePhone,
        workPhone: contactInfo.workPhone,
        preferredPhone: contactInfo.preferredPhone
      };
      
      // Also save the personal info fields that are now in contact section
      const personalData = {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth
      };
      
      // Save both contact and partial personal info
      const [contactResult, personalResult] = await Promise.all([
        updateMemberContactInfo(salesforceContactId, contactData),
        updateMemberPersonalInfo(salesforceContactId, personalData)
      ]);
      
      if (contactResult.success && personalResult.success) {
        setSaveMessage({ type: 'success', text: 'Contact information saved successfully!' });
        setOriginalData(prev => ({ 
          ...prev, 
          contact: contactInfo,
          personal: { ...prev.personal, ...personalData }
        }));
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
      // Map component values back to Salesforce values
      const dataToSend = {
        // Note: Some fields like method and CMS waiver might be read-only
        nonCryoRemainArrangements: mapRemainsHandlingToSF(cryoArrangements.remainsHandling),
        memberPublicDisclosure: mapPublicDisclosureToSF(cryoArrangements.publicDisclosure),
        recipientName: cryoArrangements.recipientName,
        recipientPhone: cryoArrangements.recipientPhone,
        recipientEmail: cryoArrangements.recipientEmail
      };
      
      const result = await updateMemberCryoArrangements(salesforceContactId, dataToSend);
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
  
  // Show loading while we wait for salesforceContactId or data is loading
  if (!salesforceContactId || isLoading) {
    return <Loading text="Loading your information..." />;
  }
  
  // Loading skeleton component
  const SectionSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
  
  return (
    //<div className="px-4 sm:px-6 lg:px-8">
    //<div className="bg-gray-50 -m-8 p-4 sm:p-4 lg:pl-0 min-h-screen overflow-x-hidden max-w-full mx-auto">
    <div className="bg-gray-50 -m-8 p-4 sm:p-4 lg:pl-2 pt-8 sm:pt-8 min-h-screen overflow-x-hidden max-w-full mx-auto">
      {/* Save Message */}
      {saveMessage.text && (
        <Alert 
          type={saveMessage.type} 
          onClose={() => setSaveMessage({ type: '', text: '' })}
        >
          {saveMessage.text}
        </Alert>
      )}
      
      {/* Contact Information - Now First with Name and DOB */}
      {!sectionsLoaded.contact ? (
        <SectionSkeleton />
      ) : (
        <ContactInfoSection
          contactInfo={contactInfo || {}}
          setContactInfo={setContactInfo}
          personalInfo={personalInfo || {}}
          setPersonalInfo={setPersonalInfo}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveContactInfo={saveContactInfo}
          savingSection={savingSection}
        />
      )}
      
      {/* Section Separator */}
      <div className={sectionSeparator} />
            
      {/* Personal Information - Now Second */}
      {!sectionsLoaded.personal ? (
        <SectionSkeleton />
      ) : (
        <PersonalInfoSection
          personalInfo={personalInfo || {}}
          setPersonalInfo={setPersonalInfo}
          familyInfo={familyInfo || {}}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          savePersonalInfo={savePersonalInfo}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Addresses */}
      {!sectionsLoaded.addresses ? (
        <SectionSkeleton />
      ) : (
        <AddressesSection
          addresses={addresses || {}}
          setAddresses={setAddresses}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveAddresses={saveAddresses}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Family Information */}
      {!sectionsLoaded.family ? (
        <SectionSkeleton />
      ) : (
        <FamilyInfoSection
          familyInfo={familyInfo || {}}
          setFamilyInfo={setFamilyInfo}
          personalInfo={personalInfo || {}}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveFamilyInfo={saveFamilyInfo}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Occupation */}
      {!sectionsLoaded.occupation ? (
        <SectionSkeleton />
      ) : (
        <OccupationSection
          occupation={occupation || {}}
          setOccupation={setOccupation}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveOccupation={saveOccupation}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Medical Information */}
      {!sectionsLoaded.medical ? (
        <SectionSkeleton />
      ) : (
        <MedicalInfoSection
          medicalInfo={medicalInfo || {}}
          setMedicalInfo={setMedicalInfo}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveMedicalInfo={saveMedicalInfo}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Cryopreservation Arrangements */}
      {!sectionsLoaded.cryoArrangements ? (
        <SectionSkeleton />
      ) : (
        <CryoArrangementsSection
          cryoArrangements={cryoArrangements || {}}
          setCryoArrangements={setCryoArrangements}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveCryoArrangements={saveCryoArrangements}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Funding/Life Insurance */}
      {!sectionsLoaded.funding ? (
        <SectionSkeleton />
      ) : (
        <FundingSection
          funding={funding || {}}
          setFunding={setFunding}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveFunding={saveFunding}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Legal/Will */}
      {!sectionsLoaded.legal ? (
        <SectionSkeleton />
      ) : (
        <LegalSection
          legal={legal || {}}
          setLegal={setLegal}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveLegal={saveLegal}
          savingSection={savingSection}
        />
      )}

      {/* Section Separator */}
      <div className={sectionSeparator} />

      {/* Next of Kin */}
      {!sectionsLoaded.nextOfKin ? (
        <SectionSkeleton />
      ) : (
        <NextOfKinSection
          nextOfKin={nextOfKin || {}}
          setNextOfKin={setNextOfKin}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveNextOfKin={saveNextOfKin}
          savingSection={savingSection}
        />
      )}
    </div>
  );
};

export default MyInformationTab;