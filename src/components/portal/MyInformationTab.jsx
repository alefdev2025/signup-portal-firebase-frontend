// VERSION 1



import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { memberDataService } from './services/memberDataService';
import dewarsImage from '../../assets/images/dewars2.jpg';

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

import { 
  cleanAddressData, 
  cleanPersonData,
  formatPersonName,
  formatEmail,
  formatPhone,
  formatCity,
  cleanString,
  formatStreetAddress,
  formatStateProvince,
  formatPostalCode,
  formatCountry,
  cleanDataBeforeSave,
} from './utils/dataFormatting';

// Import styled components
import { Alert, Loading, Button } from './FormComponents';

import { getMemberCategory } from './services/salesforce/memberInfo';

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

import { memberCategoryConfig, isFieldRequired, isSectionVisible } from './memberCategoryConfig';


// Import style config
import styleConfig from './styleConfig';

const MyInformationTab = () => {
  const { 
    salesforceContactId, 
    memberInfoData, 
    memberInfoLoaded, 
    refreshMemberInfo 
  } = useMemberPortal();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState('');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // Categorize member
  const [memberCategory, setMemberCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  
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
  
  // Field errors state
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Address validation modal state
  const [addressValidationModal, setAddressValidationModal] = useState({
    isOpen: false,
    addressType: '',
    originalAddress: {},
    suggestedAddress: {},
    onAccept: null
  });


  const [initializedFromCache, setInitializedFromCache] = useState(false);

  // Define separator style using styleConfig
  const sectionSeparator = () => (
    <div className={styleConfig.separator.wrapper}></div>
  );
  
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
  
  useEffect(() => {
    if (!salesforceContactId) return;
    
    const initializeData = async () => {
      // First, try to use cached data if available
      if (memberInfoLoaded && memberInfoData && !initializedFromCache) {
        console.log('📦 [MyInformationTab] Using preloaded member data');
        
        // Process and set all the cached data
        if (memberInfoData.personal?.success && memberInfoData.personal.data) {
          const personalData = memberInfoData.personal.data.data || memberInfoData.personal.data;
          const cleanedPersonal = cleanPersonData(personalData);
          setPersonalInfo(cleanedPersonal);
          setOriginalData(prev => ({ ...prev, personal: cleanedPersonal }));
        }
        
        if (memberInfoData.contact?.success && memberInfoData.contact.data) {
          const contactData = memberInfoData.contact.data.data || memberInfoData.contact.data;
          const cleanedContact = {
            ...contactData,
            personalEmail: formatEmail(contactData.personalEmail),
            workEmail: formatEmail(contactData.workEmail),
            email: formatEmail(contactData.email),
            homePhone: formatPhone(contactData.homePhone),
            mobilePhone: formatPhone(contactData.mobilePhone),
            workPhone: formatPhone(contactData.workPhone),
            preferredPhone: cleanString(contactData.preferredPhone)
          };
          setContactInfo(cleanedContact);
          setOriginalData(prev => ({ ...prev, contact: cleanedContact }));
        }
        
        if (memberInfoData.addresses?.success && memberInfoData.addresses.data) {
          const addressData = memberInfoData.addresses.data.data || memberInfoData.addresses.data;
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
            sameAsHome: false
          };
          const cleanedAddresses = cleanAddressData(transformedAddresses);
          setAddresses(cleanedAddresses);
          setOriginalData(prev => ({ ...prev, addresses: cleanedAddresses }));
        }
        
        if (memberInfoData.family?.success && memberInfoData.family.data) {
          const familyData = memberInfoData.family.data.data || memberInfoData.family.data;
          const transformedFamily = {
            fathersName: formatPersonName(familyData.fatherName),
            fathersBirthplace: formatCity(familyData.fatherBirthplace),
            mothersMaidenName: formatPersonName(familyData.motherMaidenName),
            mothersBirthplace: formatCity(familyData.motherBirthplace),
            spousesName: formatPersonName(familyData.spouseName)
          };
          setFamilyInfo(transformedFamily);
          setOriginalData(prev => ({ ...prev, family: transformedFamily }));
        }
        
        if (memberInfoData.occupation?.success && memberInfoData.occupation.data) {
          const occupationData = memberInfoData.occupation.data.data || memberInfoData.occupation.data;
          const cleanedOccupation = {
            ...occupationData,
            occupation: cleanString(occupationData.occupation),
            occupationalIndustry: cleanString(occupationData.occupationalIndustry),
            militaryBranch: cleanString(occupationData.militaryBranch)
          };
          setOccupation(cleanedOccupation);
          setOriginalData(prev => ({ ...prev, occupation: cleanedOccupation }));
        }
        
        if (memberInfoData.medical?.success && memberInfoData.medical.data) {
          const medicalData = memberInfoData.medical.data.data || memberInfoData.medical.data;
          const cleanedMedical = cleanDataBeforeSave(medicalData, 'medical');
          setMedicalInfo(cleanedMedical);
          setOriginalData(prev => ({ ...prev, medical: cleanedMedical }));
        }
        
        if (memberInfoData.cryo?.success && memberInfoData.cryo.data) {
          const cryoData = memberInfoData.cryo.data.data || memberInfoData.cryo.data;
          const transformedCryo = {
            method: cryoData.methodOfPreservation?.includes('Whole Body') ? 'WholeBody' : 
                    cryoData.methodOfPreservation?.includes('Neuro') ? 'Neuro' : '',
            cmsWaiver: cryoData.cmsWaiver === 'Yes',
            remainsHandling: mapRemainsHandling(cryoData.nonCryoRemainArrangements),
            recipientName: formatPersonName(cryoData.recipientName),
            recipientPhone: formatPhone(cryoData.recipientPhone),
            recipientEmail: formatEmail(cryoData.recipientEmail),
            publicDisclosure: mapPublicDisclosure(cryoData.memberPublicDisclosure || cryoData.publicDisclosure),
            fundingStatus: cryoData.fundingStatus,
            contractDate: cryoData.contractDate,
            memberJoinDate: cryoData.memberJoinDate,
            contractComplete: cryoData.contractComplete,
            isPatient: cryoData.isPatient,
            recipientAddress: cryoData.recipientAddress
          };
          setCryoArrangements(transformedCryo);
          setOriginalData(prev => ({ ...prev, cryoArrangements: transformedCryo }));
        }
        
        if (memberInfoData.emergency?.success && memberInfoData.emergency.data) {
          const emergencyResponse = memberInfoData.emergency.data;
          const nextOfKinArray = emergencyResponse.data?.nextOfKin || emergencyResponse.nextOfKin;
          
          if (nextOfKinArray && nextOfKinArray.length > 0) {
            const primaryContact = nextOfKinArray[0];
            const transformedNextOfKin = {
              fullName: formatPersonName(primaryContact.fullName || ''),
              relationship: cleanString(primaryContact.relationship || ''),
              phone: formatPhone(primaryContact.mobilePhone || primaryContact.homePhone || ''),
              email: formatEmail(primaryContact.email || ''),
              address: primaryContact.address ? 
                `${formatStreetAddress(primaryContact.address.street || '')}, ${formatCity(primaryContact.address.city || '')}, ${formatStateProvince(primaryContact.address.state || '')} ${formatPostalCode(primaryContact.address.postalCode || '')}`.trim().replace(/^,\s*|,\s*$/g, '') :
                ''
            };
            setNextOfKin(transformedNextOfKin);
            setOriginalData(prev => ({ ...prev, nextOfKin: transformedNextOfKin }));
          }
        }
        
        if (memberInfoData.insurance?.success && memberInfoData.insurance.data) {
          const insuranceData = memberInfoData.insurance.data.data || memberInfoData.insurance.data;
          if (insuranceData.length > 0) {
            const primaryInsurance = insuranceData[0];
            const transformedFunding = {
              fundingType: 'LifeInsurance',
              companyName: cleanString(primaryInsurance.companyName),
              policyNumber: cleanString(primaryInsurance.policyNumber),
              policyType: cleanString(primaryInsurance.policyType),
              faceAmount: primaryInsurance.faceAmount || ''
            };
            setFunding(transformedFunding);
            setOriginalData(prev => ({ ...prev, funding: transformedFunding }));
          }
        }
        
        if (memberInfoData.category?.success && memberInfoData.category.data) {
          setMemberCategory(memberInfoData.category.data.category);
          setCategoryLoading(false);
        }
        
        setInitializedFromCache(true);
        setIsLoading(false);
      } else if (!memberInfoLoaded) {
        // No cached data available, load fresh
        console.log('🔄 [MyInformationTab] No cached data, loading fresh...');
        loadAllData();
      }
    };
    
    initializeData();
  }, [salesforceContactId, memberInfoLoaded, memberInfoData, initializedFromCache]);

  useEffect(() => {
    if (salesforceContactId) {
      loadMemberCategory();
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
  

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .my-information-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .my-information-tab .font-bold,
      .my-information-tab .font-semibold,
      .my-information-tab h1,
      .my-information-tab h2,
      .my-information-tab h3,
      .my-information-tab h4 {
        font-weight: 700 !important;
      }
      .my-information-tab .font-medium {
        font-weight: 500 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Effect to handle body overflow when modal is open
  useEffect(() => {
    if (addressValidationModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [addressValidationModal.isOpen]);

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
        cryoRes,
        legalRes,
        emergencyRes,
        insuranceRes
      ] = await Promise.allSettled([
        memberDataService.getPersonalInfo(salesforceContactId),
        memberDataService.getContactInfo(salesforceContactId),
        memberDataService.getAddresses(salesforceContactId),
        memberDataService.getFamilyInfo(salesforceContactId),
        memberDataService.getOccupation(salesforceContactId),
        memberDataService.getMedicalInfo(salesforceContactId),
        memberDataService.getCryoArrangements(salesforceContactId),
        memberDataService.getLegalInfo(salesforceContactId),
        memberDataService.getEmergencyContacts(salesforceContactId),
        memberDataService.getInsurance(salesforceContactId)
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
      
      // Update states with fetched and cleaned data
      console.log('API Responses:', results);
      
      // In the loadAllData function, update the Personal Info section:
      if (results.personalRes.success && results.personalRes.data) {
        const personalData = results.personalRes.data.data || results.personalRes.data;
        console.log('🎯 === PERSONAL INFO DATA RECEIVED ===');
        console.log('📦 Raw personal data from API:', personalData);
        console.log('📋 Key fields:', {
          ethnicity: personalData.ethnicity,
          citizenship: personalData.citizenship,
          maritalStatus: personalData.maritalStatus,
          hasAgreement: personalData.hasAgreement
        });
        
        const cleanedPersonal = cleanPersonData(personalData);
        
        console.log('✨ After cleanPersonData:', {
          ethnicity: cleanedPersonal.ethnicity,
          citizenship: cleanedPersonal.citizenship,
          maritalStatus: cleanedPersonal.maritalStatus
        });
        console.log('🎯 === END PERSONAL INFO ===\n');
        
        setPersonalInfo(cleanedPersonal);
        setOriginalData(prev => ({ ...prev, personal: cleanedPersonal }));
      }
      
      // Contact Info - Clean all contact data
      if (results.contactRes.success && results.contactRes.data) {
        const contactData = results.contactRes.data.data || results.contactRes.data;
        console.log('Setting contact info data:', contactData);
        
        // Clean contact data
        const cleanedContact = {
          ...contactData,
          personalEmail: formatEmail(contactData.personalEmail),
          workEmail: formatEmail(contactData.workEmail),
          email: formatEmail(contactData.email),
          homePhone: formatPhone(contactData.homePhone),
          mobilePhone: formatPhone(contactData.mobilePhone),
          workPhone: formatPhone(contactData.workPhone),
          preferredPhone: cleanString(contactData.preferredPhone)
        };
        
        setContactInfo(cleanedContact);
        setOriginalData(prev => ({ ...prev, contact: cleanedContact }));
      }
      
      // Addresses - Clean all address data
      if (results.addressRes.success && results.addressRes.data) {
        const addressData = results.addressRes.data.data || results.addressRes.data;
        
        console.log('🔍 === DEBUG Address Loading ===');
        console.log('📦 Raw addressData from backend:', addressData);
        
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
          sameAsHome: false
        };
        
        // Clean the addresses after transformation
        const cleanedAddresses = cleanAddressData(transformedAddresses);
        
        console.log('✨ Cleaned addresses:', cleanedAddresses);
        console.log('🔍 === END DEBUG ===\n');
        
        setAddresses(cleanedAddresses);
        setOriginalData(prev => ({ ...prev, addresses: cleanedAddresses }));
      }
      
      // Family Info - Clean all family data
      if (results.familyRes.success && results.familyRes.data) {
        const familyData = results.familyRes.data.data || results.familyRes.data;
        console.log('Setting family info data:', familyData);
        
        // Transform and clean family data
        const transformedFamily = {
          fathersName: formatPersonName(familyData.fatherName),
          fathersBirthplace: formatCity(familyData.fatherBirthplace),
          mothersMaidenName: formatPersonName(familyData.motherMaidenName),
          mothersBirthplace: formatCity(familyData.motherBirthplace),
          spousesName: formatPersonName(familyData.spouseName)
        };
        
        setFamilyInfo(transformedFamily);
        setOriginalData(prev => ({ ...prev, family: transformedFamily }));
      }
      
      // Occupation - Clean occupation data
      if (results.occupationRes.success && results.occupationRes.data) {
        const occupationData = results.occupationRes.data.data || results.occupationRes.data;
        console.log('Setting occupation data:', occupationData);
        
        const cleanedOccupation = {
          ...occupationData,
          occupation: cleanString(occupationData.occupation),
          occupationalIndustry: cleanString(occupationData.occupationalIndustry),
          militaryBranch: cleanString(occupationData.militaryBranch)
        };
        
        setOccupation(cleanedOccupation);
        setOriginalData(prev => ({ ...prev, occupation: cleanedOccupation }));
      }
      
      // Medical Info - Clean medical data
      if (results.medicalRes.success && results.medicalRes.data) {
        const medicalData = results.medicalRes.data.data || results.medicalRes.data;
        console.log('🏥 === MEDICAL INFO FROM BACKEND ===');
        console.log('📦 Raw medical data:', medicalData);
        console.log('📏 Height value:', medicalData.height, 'Type:', typeof medicalData.height);
        console.log('⚖️ Weight value:', medicalData.weight, 'Type:', typeof medicalData.weight);
        
        // Use cleanDataBeforeSave to properly clean all fields
        const cleanedMedical = cleanDataBeforeSave(medicalData, 'medical');
        
        console.log('✨ Cleaned medical data:');
        console.log('📏 Cleaned height:', cleanedMedical.height, 'Type:', typeof cleanedMedical.height);
        console.log('⚖️ Cleaned weight:', cleanedMedical.weight, 'Type:', typeof cleanedMedical.weight);
        console.log('🏥 === END MEDICAL INFO ===\n');
        
        setMedicalInfo(cleanedMedical);
        setOriginalData(prev => ({ ...prev, medical: cleanedMedical }));
      }
      
      // Process Cryopreservation Arrangements
      if (results.cryoRes.success && results.cryoRes.data) {
        const cryoData = results.cryoRes.data.data || results.cryoRes.data;
        console.log('Setting cryo arrangements data:', cryoData);
        
        // Transform and clean the data
        const transformedCryo = {
          method: cryoData.methodOfPreservation?.includes('Whole Body') ? 'WholeBody' : 
                  cryoData.methodOfPreservation?.includes('Neuro') ? 'Neuro' : '',
          cmsWaiver: cryoData.cmsWaiver === 'Yes',
          remainsHandling: mapRemainsHandling(cryoData.nonCryoRemainArrangements),
          recipientName: formatPersonName(cryoData.recipientName),
          recipientPhone: formatPhone(cryoData.recipientPhone),
          recipientEmail: formatEmail(cryoData.recipientEmail),
          publicDisclosure: mapPublicDisclosure(cryoData.memberPublicDisclosure || cryoData.publicDisclosure),
          fundingStatus: cryoData.fundingStatus,
          contractDate: cryoData.contractDate,
          memberJoinDate: cryoData.memberJoinDate,
          contractComplete: cryoData.contractComplete,
          isPatient: cryoData.isPatient,
          recipientAddress: cryoData.recipientAddress
        };
        
        setCryoArrangements(transformedCryo);
        setOriginalData(prev => ({ ...prev, cryoArrangements: transformedCryo }));
      }
      
      // Process Emergency Contacts (Next of Kin)
      if (results.emergencyRes.success && results.emergencyRes.data) {
        const emergencyResponse = results.emergencyRes.data;
        console.log('Emergency contacts response:', emergencyResponse);
        
        const nextOfKinArray = emergencyResponse.data?.nextOfKin || emergencyResponse.nextOfKin;
        
        if (nextOfKinArray && nextOfKinArray.length > 0) {
          const primaryContact = nextOfKinArray[0];
          console.log('Primary contact data:', primaryContact);
          
          // Clean all the data when loading from backend
          const transformedNextOfKin = {
            fullName: formatPersonName(primaryContact.fullName || ''),
            relationship: cleanString(primaryContact.relationship || ''),
            phone: formatPhone(primaryContact.mobilePhone || primaryContact.homePhone || ''),
            email: formatEmail(primaryContact.email || ''),
            address: primaryContact.address ? 
              `${formatStreetAddress(primaryContact.address.street || '')}, ${formatCity(primaryContact.address.city || '')}, ${formatStateProvince(primaryContact.address.state || '')} ${formatPostalCode(primaryContact.address.postalCode || '')}`.trim().replace(/^,\s*|,\s*$/g, '') :
              ''
          };
          
          console.log('Transformed and cleaned next of kin:', transformedNextOfKin);
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
        
        if (insuranceData.length > 0) {
          const primaryInsurance = insuranceData[0];
          const transformedFunding = {
            fundingType: 'LifeInsurance',
            companyName: cleanString(primaryInsurance.companyName),
            policyNumber: cleanString(primaryInsurance.policyNumber),
            policyType: cleanString(primaryInsurance.policyType),
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

  function mapPublicDisclosure(sfValue) {
    if (!sfValue) return '';
    
    const valueLower = sfValue.toLowerCase();
    
    if (valueLower.includes('freely release')) {
      return 'freely';  // Simple code
    } else if (valueLower.includes('reasonable efforts') || valueLower.includes('confidentiality')) {
      return 'confidential';  // Simple code
    }
    
    return '';
  }
  
  function mapRemainsHandling(sfValue) {
    if (!sfValue) return '';
    
    const valueLower = sfValue.toLowerCase();
    
    if (valueLower.includes('delivery') && valueLower.includes('named person')) {
      return 'return';  // Simple code
    } else if (valueLower.includes('research') || valueLower.includes('tissue donation')) {
      return 'donate';  // Simple code
    }
    
    return '';
  }

function mapRemainsHandlingToSF(value) {
  switch(value) {
    case 'Return':
      // EXACT value from picklist - WITH period at end
      return "Alcor Cremation and Disposition of Cryopreservation Member's Non-Cryopreserved Human Remains and the delivery of such cremated materials to a named person/entity.";
    case 'Donate':
      // EXACT value from picklist - WITH period at end
      return "Alcor Cremation and Disposition of Cryopreservation Member's Non-Cryopreserved Human Remains with disposal or retainage thereof in Alcor's sole discretion, with possible use for research or tissue donation.";
    default:
      return null;
  }
}

function mapPublicDisclosureToSF(value) {
  switch(value) {
    case 'Freely':
      // EXACT value from picklist - NO period at end
      return "I give Alcor permission to freely release my name and related Alcor membership status at its discretion";
    case 'BeforeDeath':
      // EXACT value from picklist - WITH period at end
      return "Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor's General Terms and Conditions.";
    default:
      return null;
  }
}
  // Toggle edit mode for a section
  const toggleEditMode = (section) => {
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Add this component definition before the MyInformationTab component
const MemberStatusBanner = ({ category }) => {
  const categoryInfo = {
    BasicMember: {
      label: 'Basic Member',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '👤',
      message: 'Complete your profile to apply for cryopreservation'
    },
    CryoApplicant: {
      label: 'Cryopreservation Applicant',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '📝',
      message: 'Complete all required fields to become a full member'
    },
    CryoMember: {
      label: 'Cryopreservation Member',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✓',
      message: 'Your membership is active'
    }
  };
  
  const info = categoryInfo[category] || categoryInfo.BasicMember;
  
  return (
    <div className={`rounded-lg p-4 mb-6 border ${info.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{info.icon}</span>
          <div>
            <h3 className="font-semibold text-lg">{info.label}</h3>
            <p className="text-sm opacity-90">{info.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const loadMemberCategory = async () => {
  console.log('🔍 === loadMemberCategory START (Frontend) ===');
  console.log('📋 Salesforce Contact ID:', salesforceContactId);
  
  setCategoryLoading(true);
  try {
    console.log('🌐 Calling getMemberCategory API...');
    const result = await getMemberCategory(salesforceContactId);
    console.log('📦 API Response:', result);
    
    if (result.success) {
      console.log('✅ Category determined:', result.data.category);
      console.log('📊 Details:', result.data.details);
      console.log('🔍 Debug info:', result.data.debug);
      
      setMemberCategory(result.data.category);
      
      // Log what sections will be visible
      console.log('\n📋 Section Visibility for', result.data.category + ':');
      const config = memberCategoryConfig[result.data.category];
      if (config) {
        Object.keys(config.sections).forEach(section => {
          console.log(`  - ${section}: ${config.sections[section].visible ? '✓ Visible' : '✗ Hidden'}`);
        });
      }
    } else {
      console.error('❌ Failed to load member category:', result.error);
      console.log('⚠️ Defaulting to BasicMember');
      setMemberCategory('BasicMember');
    }
  } catch (error) {
    console.error('❌ Error loading member category:', error);
    console.log('⚠️ Defaulting to BasicMember');
    setMemberCategory('BasicMember');
  } finally {
    setCategoryLoading(false);
    console.log('🔍 === loadMemberCategory END (Frontend) ===\n');
  }
};
  
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
        setFieldErrors({}); // Clear any field errors
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
    // Clear any field errors for all sections
    setFieldErrors({});
  };

  const savePersonalInfo = async () => {
    console.log('🔵 === START savePersonalInfo ===');
    console.log('Member category:', memberCategory);
    
    // Store current state for rollback
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('personal');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.personal?.requiredFields || [];
      console.log('Required fields for personal section:', requiredFields);
      
      // Clean the data before validation and sending
      const cleanedData = cleanDataBeforeSave(personalInfo, 'personal');
      
      // Validate required fields
      const errors = {};
      
      requiredFields.forEach(field => {
        switch(field) {
          case 'gender':
            if (!cleanedData.gender) {
              errors.gender = 'Gender is required';
            }
            break;
          case 'dateOfBirth':
            if (!cleanedData.dateOfBirth) {
              errors.dateOfBirth = 'Date of birth is required';
            }
            break;
          case 'ssn':
            if (!cleanedData.ssn || cleanedData.ssn.includes('XXX')) {
              errors.ssn = memberCategory === 'CryoMember' 
                ? 'SSN is required for Cryopreservation Members' 
                : 'SSN is recommended';
            }
            break;
        }
      });
      
      // If there are validation errors, rollback and show them
      if (Object.keys(errors).length > 0) {
        let errorMessage = 'Please fill in required fields: ';
        errorMessage += Object.values(errors).join(', ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        
        // Rollback state
        setPersonalInfo(previousPersonalInfo);
        return;
      }
      
      console.log('📤 Cleaned data being sent:', JSON.stringify(cleanedData, null, 2));
      
      const result = await updateMemberPersonalInfo(salesforceContactId, cleanedData);
      
      if (!result.success && !result.partialSuccess) {
        // Complete failure - rollback
        setPersonalInfo(previousPersonalInfo);
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save personal information' });
        setSavingSection('');
        return;
      }
      
      // Handle partial success
      if (result.partialSuccess) {
        console.log('⚠️ Partial success - some fields may not have been updated');
        const errorDetails = result.errors ? result.errors.join('; ') : '';
        setSaveMessage({ 
          type: 'warning', 
          text: `Some information was saved, but there were errors: ${errorDetails}` 
        });
      } else {
        // Complete success
        setSaveMessage({ type: 'success', text: 'Personal information saved successfully!' });
      }
      
      // Update state with cleaned data
      setPersonalInfo(cleanedData);
      setOriginalData(prev => ({ ...prev, personal: cleanedData }));
      setEditMode(prev => ({ ...prev, personal: false }));
      
      // Clear cache after successful save
      memberDataService.clearCache(salesforceContactId);
      
      // Fetch fresh data to ensure sync
      try {
        const freshData = await memberDataService.getPersonalInfo(salesforceContactId);
        if (freshData.success && freshData.data) {
          const personalData = freshData.data.data || freshData.data;
          const cleanedPersonal = cleanPersonData(personalData);
          setPersonalInfo(cleanedPersonal);
          setOriginalData(prev => ({ ...prev, personal: cleanedPersonal }));
        }
      } catch (refreshError) {
        console.error('Error refreshing personal data:', refreshError);
        // Non-critical error - data was saved successfully
      }
      
      // Refresh the main cache
      if (refreshMemberInfo) {
        setTimeout(() => {
          console.log('🔄 [MyInformationTab] Refreshing cache after save...');
          refreshMemberInfo();
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Error in savePersonalInfo:', error);
      
      // Rollback on error
      setPersonalInfo(previousPersonalInfo);
      setSaveMessage({ type: 'error', text: `Failed to save: ${error.message}` });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
      console.log('🔵 === END savePersonalInfo ===\n');
    }
  };
  
  const saveContactInfo = async () => {
    // Store current state for rollback
    const previousContactInfo = { ...contactInfo };
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('contact');
    setSaveMessage({ type: '', text: '' });
    setFieldErrors({});
    
    try {
      // Validate salesforceContactId
      if (!salesforceContactId) {
        console.error('No salesforceContactId available!');
        setSaveMessage({ type: 'error', text: 'Contact ID not found. Please refresh the page.' });
        setSavingSection('');
        return;
      }
      
      console.log('Starting saveContactInfo with salesforceContactId:', salesforceContactId);
      console.log('Member category:', memberCategory);
      
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.contact?.requiredFields || [];
      console.log('Required fields for contact section:', requiredFields);
      
      // Clean the data
      const cleanedContactData = cleanDataBeforeSave(contactInfo, 'contact');
      const cleanedPersonalData = cleanDataBeforeSave(personalInfo, 'personal');
      
      // Transform data to match backend expectations
      const contactData = {
        email: cleanedContactData.personalEmail || '',
        personalEmail: cleanedContactData.personalEmail || '',
        workEmail: cleanedContactData.workEmail || '',
        homePhone: cleanedContactData.homePhone || '',
        mobilePhone: cleanedContactData.mobilePhone || '',
        workPhone: cleanedContactData.workPhone || '',
        preferredPhone: cleanedContactData.preferredPhone || ''
      };
      
      const personalData = {
        firstName: cleanedPersonalData.firstName || '',
        middleName: cleanedPersonalData.middleName || '',
        lastName: cleanedPersonalData.lastName || ''
      };
      
      // Check if anything has actually changed
      const contactChanged = JSON.stringify(contactData) !== JSON.stringify({
        email: originalData.contact.personalEmail || '',
        personalEmail: originalData.contact.personalEmail || '',
        workEmail: originalData.contact.workEmail || '',
        homePhone: originalData.contact.homePhone || '',
        mobilePhone: originalData.contact.mobilePhone || '',
        workPhone: originalData.contact.workPhone || '',
        preferredPhone: originalData.contact.preferredPhone || ''
      });
      
      const personalChanged = personalData.firstName !== (originalData.personal.firstName || '') || 
                             personalData.middleName !== (originalData.personal.middleName || '') ||
                             personalData.lastName !== (originalData.personal.lastName || '');
      
      if (!contactChanged && !personalChanged) {
        console.log('No changes detected, skipping save');
        setSavingSection('saved');
        setEditMode(prev => ({ ...prev, contact: false }));
        setTimeout(() => setSavingSection(''), 2000);
        return;
      }
      
      // Validate required fields
      const errors = {};
      
      console.log('Validating emails:', {
        personalEmail: contactData.personalEmail,
        workEmail: contactData.workEmail
      });
      
      requiredFields.forEach(field => {
        switch(field) {
          case 'firstName':
            if (!personalData.firstName) {
              errors.firstName = 'First name is required';
            }
            break;
          case 'lastName':
            if (!personalData.lastName) {
              errors.lastName = 'Last name is required';
            }
            break;
          case 'personalEmail':
            if (!contactData.personalEmail) {
              errors.personalEmail = 'Personal email is required';
            }
            break;
        }
      });
      
      // Validate email formats for ALL email fields (not just required ones)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (contactData.personalEmail && contactData.personalEmail.trim() !== '') {
        if (!emailRegex.test(contactData.personalEmail)) {
          errors.personalEmail = 'Please enter a valid email address';
          console.log('Personal email validation failed:', contactData.personalEmail);
        }
      }
      
      if (contactData.workEmail && contactData.workEmail.trim() !== '') {
        if (!emailRegex.test(contactData.workEmail)) {
          errors.workEmail = 'Please enter a valid work email address';
          console.log('Work email validation failed:', contactData.workEmail);
        }
      }
      
      console.log('Validation errors:', errors);
      
      // Phone validation
      if (!contactData.preferredPhone) {
        errors.preferredPhone = 'Please select a preferred phone type';
      } else {
        const phoneTypeToField = {
          'Mobile': 'mobilePhone',
          'Home': 'homePhone',
          'Work': 'workPhone'
        };
        
        const requiredPhoneField = phoneTypeToField[contactData.preferredPhone];
        if (requiredPhoneField && !contactData[requiredPhoneField]) {
          errors[requiredPhoneField] = `${contactData.preferredPhone} phone is required when selected as preferred`;
        }
      }
      
      // If there are validation errors, show them under fields only
      if (Object.keys(errors).length > 0) {
        console.log('Setting field errors and returning early');
        setFieldErrors(errors);
        setSavingSection('');
        // Don't show any message at the top - only show field-level errors
        // Rollback state
        setContactInfo(previousContactInfo);
        setPersonalInfo(previousPersonalInfo);
        return;
      }
      
      // Make API calls
      console.log('Making API calls...');
      const calls = [];
      
      if (contactChanged) {
        calls.push(updateMemberContactInfo(salesforceContactId, contactData));
      }
      if (personalChanged) {
        calls.push(updateMemberPersonalInfo(salesforceContactId, personalData));
      }
      
      const results = await Promise.all(calls);
      console.log('API results:', results);
      
      const allSuccessful = results.every(result => result.success);
      
      if (!allSuccessful) {
        // Rollback UI state on failure
        setContactInfo(previousContactInfo);
        setPersonalInfo(previousPersonalInfo);
        
        // Check if any of the errors are validation errors that should show under fields
        let hasFieldError = false;
        const fieldErrorsToSet = {};
        
        results.forEach((result, index) => {
          if (!result.success && result.error) {
            // Check if it's an email validation error from the API
            if (result.error.toLowerCase().includes('email') && result.error.toLowerCase().includes('valid')) {
              fieldErrorsToSet.personalEmail = 'Please enter a valid email address';
              hasFieldError = true;
            }
            // Add other field-specific error checks as needed
          }
        });
        
        if (hasFieldError) {
          // Show field-level errors only
          setFieldErrors(fieldErrorsToSet);
          setSavingSection('');
          return;
        }
        
        // For non-field-specific errors, show at the top
        const errors = results
          .filter(result => !result.success)
          .map(result => result.error || 'Unknown error');
        
        console.error('Save failed with errors:', errors);
        setSaveMessage({ 
          type: 'error', 
          text: `Failed to save: ${errors.join(', ')}`
        });
        setSavingSection('');
        return;
      }
      
      // SUCCESS PATH - Update everything
      setSavingSection('saved');
      setSaveMessage({ type: 'success', text: 'Contact information saved successfully!' });
      
      // Update original data to reflect saved state
      setOriginalData(prev => ({ 
        ...prev, 
        contact: cleanedContactData,
        personal: { ...prev.personal, ...cleanedPersonalData }
      }));
      
      setEditMode(prev => ({ ...prev, contact: false }));
      setFieldErrors({});
      
      // Clear cache after successful save
      memberDataService.clearCache(salesforceContactId);
      
      // Fetch fresh data to ensure sync
      try {
        const [freshContactData, freshPersonalData] = await Promise.all([
          memberDataService.getContactInfo(salesforceContactId),
          memberDataService.getPersonalInfo(salesforceContactId)
        ]);
        
        if (freshContactData.success && freshContactData.data) {
          const contactData = freshContactData.data.data || freshContactData.data;
          const cleanedContact = {
            ...contactData,
            personalEmail: formatEmail(contactData.personalEmail),
            workEmail: formatEmail(contactData.workEmail),
            email: formatEmail(contactData.email),
            homePhone: formatPhone(contactData.homePhone),
            mobilePhone: formatPhone(contactData.mobilePhone),
            workPhone: formatPhone(contactData.workPhone),
            preferredPhone: cleanString(contactData.preferredPhone)
          };
          setContactInfo(cleanedContact);
          setOriginalData(prev => ({ ...prev, contact: cleanedContact }));
        }
        
        if (freshPersonalData.success && freshPersonalData.data) {
          const personalData = freshPersonalData.data.data || freshPersonalData.data;
          const cleanedPersonal = cleanPersonData(personalData);
          setPersonalInfo(cleanedPersonal);
          setOriginalData(prev => ({ ...prev, personal: cleanedPersonal }));
        }
      } catch (refreshError) {
        console.error('Error refreshing data after save:', refreshError);
        // Non-critical error - data was saved successfully
      }
      
      // Refresh the main cache
      if (refreshMemberInfo) {
        setTimeout(() => {
          console.log('🔄 [MyInformationTab] Refreshing cache after save...');
          refreshMemberInfo();
        }, 500);
      }
      
      setTimeout(() => setSavingSection(''), 2000);
      
    } catch (error) {
      console.error('Error saving contact info:', error);
      
      // Rollback UI state on error
      setContactInfo(previousContactInfo);
      setPersonalInfo(previousPersonalInfo);
      
      // Check if it's a validation error that should show under a field
      if (error.message && error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('valid')) {
        setFieldErrors({ personalEmail: 'Please enter a valid email address' });
        setSavingSection('');
        return;
      }
      
      // For other errors, show at the top
      setSaveMessage({ 
        type: 'error', 
        text: `Failed to save contact information: ${error.message}` 
      });
      setSavingSection('');
    } finally {
      if (savingSection !== 'saved') {
        setSavingSection('');
      }
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveAddresses = async () => {
    // Store current state for rollback
    const previousAddresses = { ...addresses };
    
    setSavingSection('addresses');
    setSaveMessage({ type: '', text: '' });
    
    try {
      console.log('🚀 === SAVE ADDRESSES START ===');
      console.log('Member category:', memberCategory);
      console.log('📤 Current addresses state before save:', addresses);
      
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.addresses?.requiredFields || [];
      console.log('Required fields for addresses section:', requiredFields);
      
      // Clean the addresses data
      const cleanedAddresses = cleanDataBeforeSave(addresses, 'addresses');
      
      // Validate required fields
      const errors = {};
      
      // Home address validation
      if (requiredFields.includes('homeStreet') && !cleanedAddresses.homeStreet) {
        errors.homeStreet = 'Home street address is required';
      }
      if (requiredFields.includes('homeCity') && !cleanedAddresses.homeCity) {
        errors.homeCity = 'Home city is required';
      }
      if (requiredFields.includes('homeState') && !cleanedAddresses.homeState) {
        errors.homeState = 'Home state is required';
      }
      if (requiredFields.includes('homePostalCode') && !cleanedAddresses.homePostalCode) {
        errors.homePostalCode = 'Home postal code is required';
      }
      
      // Mailing address validation (only for CryoMember if not same as home)
      if (!cleanedAddresses.sameAsHome && memberCategory === 'CryoMember') {
        if (requiredFields.includes('mailingStreet') && !cleanedAddresses.mailingStreet) {
          errors.mailingStreet = 'Mailing street address is required';
        }
        if (requiredFields.includes('mailingCity') && !cleanedAddresses.mailingCity) {
          errors.mailingCity = 'Mailing city is required';
        }
        if (requiredFields.includes('mailingState') && !cleanedAddresses.mailingState) {
          errors.mailingState = 'Mailing state is required';
        }
        if (requiredFields.includes('mailingPostalCode') && !cleanedAddresses.mailingPostalCode) {
          errors.mailingPostalCode = 'Mailing postal code is required';
        }
      }
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = 'Please complete all required address fields';
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        
        // Rollback state
        setAddresses(previousAddresses);
        return;
      }
      
      // Transform data to match backend expectations
      const dataToSend = {
        homeAddress: {
          street: cleanedAddresses.homeStreet,
          city: cleanedAddresses.homeCity,
          state: cleanedAddresses.homeState,
          postalCode: cleanedAddresses.homePostalCode,
          country: cleanedAddresses.homeCountry
        },
        mailingAddress: {
          street: cleanedAddresses.mailingStreet,
          city: cleanedAddresses.mailingCity,
          state: cleanedAddresses.mailingState,
          postalCode: cleanedAddresses.mailingPostalCode,
          country: cleanedAddresses.mailingCountry
        },
        sameAsHome: cleanedAddresses.sameAsHome
      };
      
      console.log('📦 Data being sent to backend:', dataToSend);
      
      const result = await updateMemberAddresses(salesforceContactId, dataToSend);
      console.log('📨 Save result:', result);
      
      if (!result.success) {
        // Rollback on failure
        setAddresses(previousAddresses);
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save addresses' });
        setSavingSection('');
        return;
      }
      
      // SUCCESS PATH
      setSaveMessage({ type: 'success', text: 'Addresses saved successfully!' });
      setAddresses(cleanedAddresses);
      setOriginalData(prev => ({ ...prev, addresses: cleanedAddresses }));
      setEditMode(prev => ({ ...prev, addresses: false }));
      
      // Clear cache after successful save
      console.log('🗑️ Clearing cache...');
      memberDataService.clearCache(salesforceContactId);
      
      // Fetch fresh data to ensure sync
      try {
        const freshData = await memberDataService.getAddresses(salesforceContactId);
        if (freshData.success && freshData.data) {
          const addressData = freshData.data.data || freshData.data;
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
            sameAsHome: false
          };
          const cleanedAddresses = cleanAddressData(transformedAddresses);
          setAddresses(cleanedAddresses);
          setOriginalData(prev => ({ ...prev, addresses: cleanedAddresses }));
        }
      } catch (refreshError) {
        console.error('Error refreshing address data:', refreshError);
        // Non-critical error - data was saved successfully
      }
      
      // Refresh the main cache
      if (refreshMemberInfo) {
        setTimeout(() => {
          console.log('🔄 [MyInformationTab] Refreshing cache after save...');
          refreshMemberInfo();
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Error saving addresses:', error);
      
      // Rollback on error
      setAddresses(previousAddresses);
      setSaveMessage({ type: 'error', text: 'Failed to save addresses' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
      console.log('🚀 === SAVE ADDRESSES END ===\n');
    }
  };
  
  const saveFamilyInfo = async () => {
    console.log('🎯 saveFamilyInfo function called!');
    console.log('Current familyInfo state:', familyInfo);
    console.log('Current salesforceContactId:', salesforceContactId);
    
    // Store current state for rollback
    const previousFamilyInfo = { ...familyInfo };
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('family');
    setSaveMessage({ type: '', text: '' });
    
    try {
      console.log('🚀 === SAVE FAMILY INFO START ===');
      console.log('Member category:', memberCategory);
      console.log('📤 Current family state before save:', familyInfo);
      console.log('📤 Current personal state before save:', personalInfo);
      
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.family?.requiredFields || [];
      console.log('Required fields for family section:', requiredFields);
      
      // Check if cleanDataBeforeSave exists
      console.log('🔍 Checking cleanDataBeforeSave function exists:', typeof cleanDataBeforeSave);
      
      // Clean the family data
      let cleanedFamilyInfo, cleanedPersonalInfo;
      try {
        console.log('🧹 About to clean family info...');
        cleanedFamilyInfo = cleanDataBeforeSave(familyInfo, 'family');
        console.log('🧹 Cleaned family info successfully:', cleanedFamilyInfo);
        
        console.log('🧹 About to clean personal info...');
        cleanedPersonalInfo = cleanDataBeforeSave(personalInfo, 'personal');
        console.log('🧹 Cleaned personal info successfully:', cleanedPersonalInfo);
      } catch (cleanError) {
        console.error('❌ Error during data cleaning:', cleanError);
        throw cleanError;
      }
      
      // Validate required fields
      const errors = {};
      
      requiredFields.forEach(field => {
        console.log(`📋 Checking required field: ${field}`);
        switch(field) {
          case 'fathersName':
            if (!cleanedFamilyInfo.fathersName) {
              errors.fathersName = "Father's name is required";
              console.log('❌ Father\'s name is missing');
            }
            break;
          case 'fathersBirthplace':
            if (!cleanedFamilyInfo.fathersBirthplace || 
                (!cleanedFamilyInfo.fathersBirthplace.includes(',') && 
                 cleanedFamilyInfo.fathersBirthplace.toLowerCase() !== 'unknown' &&
                 cleanedFamilyInfo.fathersBirthplace.length < 10)) {
              errors.fathersBirthplace = "Father's complete birthplace (city, state, country) is required";
              console.log('❌ Father\'s birthplace is invalid');
            }
            break;
          case 'mothersMaidenName':
            if (!cleanedFamilyInfo.mothersMaidenName) {
              errors.mothersMaidenName = "Mother's maiden name is required";
              console.log('❌ Mother\'s maiden name is missing');
            }
            break;
          case 'mothersBirthplace':
            if (!cleanedFamilyInfo.mothersBirthplace || 
                (!cleanedFamilyInfo.mothersBirthplace.includes(',') && 
                 cleanedFamilyInfo.mothersBirthplace.toLowerCase() !== 'unknown' &&
                 cleanedFamilyInfo.mothersBirthplace.length < 10)) {
              errors.mothersBirthplace = "Mother's complete birthplace (city, state, country) is required";
              console.log('❌ Mother\'s birthplace is invalid');
            }
            break;
        }
      });
      
      console.log('❓ Validation errors:', errors);
      console.log('❓ Number of errors:', Object.keys(errors).length);
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = Object.values(errors).join('. ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        
        // Rollback state
        setFamilyInfo(previousFamilyInfo);
        setPersonalInfo(previousPersonalInfo);
        console.log('🔙 Rolled back due to validation errors');
        return;
      }
      
      console.log('✅ Validation passed, preparing data for API call...');
      
      // Transform data to match backend expectations
      const dataToSend = {
        fatherName: cleanedFamilyInfo.fathersName,
        fatherBirthplace: cleanedFamilyInfo.fathersBirthplace,
        motherMaidenName: cleanedFamilyInfo.mothersMaidenName,
        motherBirthplace: cleanedFamilyInfo.mothersBirthplace,
        // Include spouse name if married
        spouseName: cleanedPersonalInfo.maritalStatus === 'Married' ? cleanedFamilyInfo.spousesName : null
      };
      
      console.log('📦 Data being sent to backend:', JSON.stringify(dataToSend, null, 2));
      console.log('📞 Calling updateMemberFamilyInfo with ID:', salesforceContactId);
      
      // Check if updateMemberFamilyInfo exists
      console.log('🔍 Checking updateMemberFamilyInfo function exists:', typeof updateMemberFamilyInfo);
      
      if (typeof updateMemberFamilyInfo !== 'function') {
        console.error('❌ updateMemberFamilyInfo is not a function!');
        console.error('❌ Type:', typeof updateMemberFamilyInfo);
        console.error('❌ Value:', updateMemberFamilyInfo);
        throw new Error('updateMemberFamilyInfo is not properly imported');
      }
      
      let result;
      try {
        console.log('📞 === CALLING API NOW ===');
        console.log(`📞 API URL will be: /api/salesforce/member/${salesforceContactId}/family-info`);
        
        result = await updateMemberFamilyInfo(salesforceContactId, dataToSend);
        
        console.log('📨 === API CALL COMPLETED ===');
        console.log('📨 Save result:', result);
        console.log('📨 Result type:', typeof result);
        console.log('📨 Result keys:', result ? Object.keys(result) : 'null');
        console.log('📨 Result success:', result?.success);
        console.log('📨 Result data:', result?.data);
        console.log('📨 Result error:', result?.error);
        console.log('📨 Result partialSuccess:', result?.partialSuccess);
      } catch (apiError) {
        console.error('❌ === API CALL FAILED ===');
        console.error('❌ Error type:', apiError.name);
        console.error('❌ Error message:', apiError.message);
        console.error('❌ Error stack:', apiError.stack);
        console.error('❌ Full error object:', apiError);
        
        // Check if it's a network error
        if (apiError.message.includes('fetch')) {
          console.error('❌ This appears to be a network/fetch error');
        }
        
        throw apiError;
      }
      
      // Check if result is undefined or null
      if (!result) {
        console.error('❌ API returned null or undefined result');
        throw new Error('API returned no result');
      }
      
      // Check if we have at least partial success (Contact fields updated)
      const contactUpdateSuccessful = result?.data?.updateResults?.contact?.success;
      const agreementUpdateSuccessful = result?.data?.updateResults?.agreement?.success;
      
      console.log('📊 Update results analysis:');
      console.log('  - Contact update successful:', contactUpdateSuccessful);
      console.log('  - Agreement update successful:', agreementUpdateSuccessful);
      console.log('  - Overall success:', result?.success);
      console.log('  - Partial success:', result?.partialSuccess);
      
      // If neither update was successful, it's a complete failure
      if (!contactUpdateSuccessful && !agreementUpdateSuccessful && !result?.success) {
        console.log('❌ Complete save failure - no fields were updated');
        
        // Rollback on complete failure
        setFamilyInfo(previousFamilyInfo);
        setPersonalInfo(previousPersonalInfo);
        
        setSaveMessage({ 
          type: 'error', 
          text: result?.error || 'Failed to save family information. Please try again.' 
        });
        setSavingSection('');
        return;
      }
      
      // If we get here, at least something was saved successfully
      console.log('✅ At least partial save successful');
      
      // Determine the appropriate message based on what was saved
      let successMessage = 'Family information saved successfully!';
      let messageType = 'success';
      
      if (result?.partialSuccess && contactUpdateSuccessful && !agreementUpdateSuccessful) {
        // Only contact was updated (common case)
        console.log('⚠️ Partial success - Contact updated but Agreement update failed');
        // For users, this is still a success - their data is saved
        successMessage = 'Family information saved successfully!';
        messageType = 'success';
      } else if (result?.success) {
        // Both were updated successfully
        console.log('✅ Complete success - both Contact and Agreement updated');
        successMessage = 'Family information saved successfully!';
        messageType = 'success';
      }
      
      setSaveMessage({ type: messageType, text: successMessage });
      
      // Update the saved section state to show visual feedback
      setSavingSection('saved');
      
      // Update state since the save was successful (at least partially)
      setFamilyInfo(cleanedFamilyInfo);
      setOriginalData(prev => ({ ...prev, family: cleanedFamilyInfo }));
      setEditMode(prev => ({ ...prev, family: false }));
      
      // Clear cache after successful save
      console.log('🗑️ Clearing cache...');
      if (typeof memberDataService !== 'undefined' && memberDataService.clearCache) {
        memberDataService.clearCache(salesforceContactId);
        console.log('✅ Cache cleared');
      } else {
        console.warn('⚠️ memberDataService not available for cache clearing');
      }
      
      // Fetch fresh data to ensure sync - but DON'T overwrite if it fails
      try {
        console.log('🔄 Fetching fresh data...');
        if (typeof memberDataService !== 'undefined' && memberDataService.getFamilyInfo) {
          const freshData = await memberDataService.getFamilyInfo(salesforceContactId);
          console.log('📥 Fresh data received:', freshData);
          
          if (freshData.success && freshData.data) {
            const familyData = freshData.data.data || freshData.data;
            // Only update if we actually got data back
            if (familyData.fatherName !== undefined || 
                familyData.fatherBirthplace !== undefined || 
                familyData.motherMaidenName !== undefined || 
                familyData.motherBirthplace !== undefined) {
              
              const cleanedFamily = {
                fathersName: formatPersonName(familyData.fatherName || cleanedFamilyInfo.fathersName),
                fathersBirthplace: formatCity(familyData.fatherBirthplace || cleanedFamilyInfo.fathersBirthplace),
                mothersMaidenName: formatPersonName(familyData.motherMaidenName || cleanedFamilyInfo.mothersMaidenName),
                mothersBirthplace: formatCity(familyData.motherBirthplace || cleanedFamilyInfo.mothersBirthplace),
                spousesName: formatPersonName(familyData.spouseName || cleanedFamilyInfo.spousesName)
              };
              console.log('🔄 Setting refreshed family data:', cleanedFamily);
              setFamilyInfo(cleanedFamily);
              setOriginalData(prev => ({ ...prev, family: cleanedFamily }));
            } else {
              console.log('⚠️ Fresh data fetch returned empty data, keeping current state');
            }
          } else {
            console.log('⚠️ Fresh data fetch failed, keeping current state');
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing family data:', refreshError);
        // Non-critical error - data was saved successfully
      }
      
      // Refresh the main cache
      if (refreshMemberInfo) {
        setTimeout(() => {
          console.log('🔄 [MyInformationTab] Refreshing cache after save...');
          refreshMemberInfo();
        }, 500);
      } else {
        console.log('⚠️ refreshMemberInfo function not available');
      }
      
    } catch (error) {
      console.error('❌ === ERROR IN saveFamilyInfo ===');
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Full error:', error);
      
      // Rollback on error
      setFamilyInfo(previousFamilyInfo);
      setPersonalInfo(previousPersonalInfo);
      
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to save family information: ' + error.message 
      });
    } finally {
      console.log('🏁 === FINALLY BLOCK ===');
      console.log('🏁 Current savingSection:', savingSection);
      
      // Keep the 'saved' state for a moment before clearing
      if (savingSection === 'saved') {
        console.log('🏁 Keeping saved state for 2 seconds...');
        setTimeout(() => {
          console.log('🏁 Clearing saved state');
          setSavingSection('');
        }, 2000);
      } else {
        console.log('🏁 Clearing saving state immediately');
        setSavingSection('');
      }
      
      setTimeout(() => {
        console.log('🏁 Clearing save message after 5 seconds');
        setSaveMessage({ type: '', text: '' });
      }, 5000);
      
      console.log('🚀 === SAVE FAMILY INFO END ===\n');
    }
  };
  
  const saveOccupation = async () => {
    setSavingSection('occupation');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Clean the occupation data
      const cleanedOccupation = cleanDataBeforeSave(occupation, 'occupation');
      
      // Validate occupation is not just "Retired"
      if (cleanedOccupation.occupation && 
          cleanedOccupation.occupation.toLowerCase().trim() === 'retired') {
        setSaveMessage({ 
          type: 'error', 
          text: 'Please specify your occupation before retirement (e.g., "Retired Software Engineer")' 
        });
        setSavingSection('');
        return;
      }
      
      // Transform data to match backend expectations
      const dataToSend = {
        occupation: cleanedOccupation.occupation,
        industry: cleanedOccupation.occupationalIndustry,
        militaryService: cleanedOccupation.hasMilitaryService ? {
          branch: cleanedOccupation.militaryBranch,
          startYear: cleanedOccupation.servedFrom,
          endYear: cleanedOccupation.servedTo
        } : null
      };
      
      const result = await updateMemberOccupation(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Occupation saved successfully!' });
        setOccupation(cleanedOccupation);
        setOriginalData(prev => ({ ...prev, occupation: cleanedOccupation }));
        setEditMode(prev => ({ ...prev, occupation: false }));
        memberDataService.clearCache(salesforceContactId);
        
        // Refresh the cache
        if (refreshMemberInfo) {
          setTimeout(() => {
            console.log('🔄 [MyInformationTab] Refreshing cache after save...');
            refreshMemberInfo();
          }, 500);
        }
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
      console.log('Saving medical info for member category:', memberCategory);
      
      // Clean the medical data
      const cleanedData = cleanDataBeforeSave(medicalInfo, 'medical');
      
      // Get required fields for this category (if any)
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.medical?.requiredFields || [];
      console.log('Required fields for medical section:', requiredFields);
      
      // Validate required fields
      const errors = {};
      
      // Add validation for any required fields based on member category
      // For example, CryoMembers might require emergency contact info
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = Object.values(errors).join('. ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        return;
      }
      
      const result = await updateMemberMedicalInfo(salesforceContactId, cleanedData);
      
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Medical information saved successfully!' });
        setMedicalInfo(cleanedData);
        setOriginalData(prev => ({ ...prev, medical: cleanedData }));
        setEditMode(prev => ({ ...prev, medical: false }));
        memberDataService.clearCache(salesforceContactId);
        
        // Refresh the cache
        if (refreshMemberInfo) {
          setTimeout(() => {
            console.log('🔄 [MyInformationTab] Refreshing cache after save...');
            refreshMemberInfo();
          }, 500);
        }
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save medical information' });
      }
    } catch (error) {
      console.error('Error saving medical info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save medical information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveCryoArrangements = async () => {
    setSavingSection('cryoArrangements');
    setSaveMessage({ type: '', text: '' });
    
    try {
      console.log('🔵 === START saveCryoArrangements ===');
      console.log('Current cryo arrangements:', cryoArrangements);
      
      // Clean the cryo arrangements data
      const cleanedCryoArrangements = cleanDataBeforeSave(cryoArrangements, 'cryoArrangements');
      console.log('Cleaned cryo arrangements:', cleanedCryoArrangements);
      
      // Build the update object - send simple codes to backend
      const dataToSend = {};
      
      // Handle the remains handling - check for lowercase values from the select
      if (cleanedCryoArrangements.remainsHandling) {
        dataToSend.nonCryoRemainArrangements = cleanedCryoArrangements.remainsHandling; // This will be 'return' or 'donate' (lowercase)
      }
      
      // Handle the public disclosure
      if (cleanedCryoArrangements.publicDisclosure) {
        dataToSend.memberPublicDisclosure = cleanedCryoArrangements.publicDisclosure; // This will be 'freely' or 'confidential' (lowercase)
      }
      
      // Add recipient fields if applicable
      if (cleanedCryoArrangements.recipientName) {
        dataToSend.recipientName = cleanedCryoArrangements.recipientName;
      }
      if (cleanedCryoArrangements.recipientPhone) {
        dataToSend.recipientPhone = cleanedCryoArrangements.recipientPhone;
      }
      if (cleanedCryoArrangements.recipientEmail) {
        dataToSend.recipientEmail = cleanedCryoArrangements.recipientEmail;
      }
      
      console.log('📤 Data being sent to backend:', JSON.stringify(dataToSend, null, 2));
      
      const result = await updateMemberCryoArrangements(salesforceContactId, dataToSend);
      console.log('📨 Save result:', result);
      
      if (result.success) {
        setSaveMessage({ 
          type: 'success', 
          text: result.warning || 'Cryopreservation arrangements saved successfully!' 
        });
        setCryoArrangements(cleanedCryoArrangements);
        setOriginalData(prev => ({ ...prev, cryoArrangements: cleanedCryoArrangements }));
        setEditMode(prev => ({ ...prev, cryoArrangements: false }));
        memberDataService.clearCache(salesforceContactId);
        
        // Refresh the cache
        if (refreshMemberInfo) {
          setTimeout(() => {
            console.log('🔄 [MyInformationTab] Refreshing cache after save...');
            refreshMemberInfo();
          }, 500);
        }
      } else {
        console.error('❌ Save failed:', result.error);
        setSaveMessage({ 
          type: 'error', 
          text: result.error || 'Failed to save cryopreservation arrangements' 
        });
      }
    } catch (error) {
      console.error('❌ Error saving cryo arrangements:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to save cryopreservation arrangements. Please try again or contact support.' 
      });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
      console.log('🔵 === END saveCryoArrangements ===\n');
    }
  };
  
  const saveFunding = async () => {
    setSavingSection('funding');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Clean the funding data
      const cleanedFunding = cleanDataBeforeSave(funding, 'funding');
      
      // For insurance, we need to create or update the insurance record
      if (cleanedFunding.fundingType === 'LifeInsurance') {
        const insuranceData = {
          companyName: cleanedFunding.companyName,
          policyNumber: cleanedFunding.policyNumber,
          policyType: cleanedFunding.policyType,
          faceAmount: cleanedFunding.faceAmount,
          // Add other insurance fields as needed
        };
        
        // This would need a create or update API
        const result = await createMemberInsurance(salesforceContactId, insuranceData);
        if (result.success) {
          setSaveMessage({ type: 'success', text: 'Insurance information saved successfully!' });
          setFunding(cleanedFunding);
          setOriginalData(prev => ({ ...prev, funding: cleanedFunding }));
          setEditMode(prev => ({ ...prev, funding: false }));
          memberDataService.clearCache(salesforceContactId);
          
          // Refresh the cache
          if (refreshMemberInfo) {
            setTimeout(() => {
              console.log('🔄 [MyInformationTab] Refreshing cache after save...');
              refreshMemberInfo();
            }, 500);
          }
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
      // Clean the legal data
      const cleanedLegal = cleanDataBeforeSave(legal, 'legal');
      
      const dataToSend = {
        hasWill: cleanedLegal.hasWill === 'Yes',
        willContraryToCryonics: cleanedLegal.contraryProvisions === 'Yes'
      };
      
      const result = await updateMemberLegalInfo(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Legal information saved successfully!' });
        setLegal(cleanedLegal);
        setOriginalData(prev => ({ ...prev, legal: cleanedLegal }));
        setEditMode(prev => ({ ...prev, legal: false }));
        memberDataService.clearCache(salesforceContactId);
        
        // Refresh the cache
        if (refreshMemberInfo) {
          setTimeout(() => {
            console.log('🔄 [MyInformationTab] Refreshing cache after save...');
            refreshMemberInfo();
          }, 500);
        }
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
      console.log('Saving next of kin for member category:', memberCategory);
      
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.nextOfKin?.requiredFields || [];
      console.log('Required fields for next of kin section:', requiredFields);
      
      // Clean the next of kin data
      const cleanedNextOfKin = cleanDataBeforeSave(nextOfKin, 'nextOfKin');
      
      // Validate required fields
      const errors = {};
      
      requiredFields.forEach(field => {
        switch(field) {
          case 'fullName':
            if (!cleanedNextOfKin.fullName) {
              errors.fullName = 'Full name is required';
            }
            break;
          case 'relationship':
            if (!cleanedNextOfKin.relationship) {
              errors.relationship = 'Relationship is required';
            }
            break;
          case 'phone':
            if (!cleanedNextOfKin.phone) {
              errors.phone = 'Phone number is required';
            }
            break;
          case 'email':
            if (!cleanedNextOfKin.email && memberCategory === 'CryoMember') {
              errors.email = 'Email is required for Cryopreservation Members';
            } else if (cleanedNextOfKin.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedNextOfKin.email)) {
              errors.email = 'Please enter a valid email address';
            }
            break;
        }
      });
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = Object.values(errors).join('. ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        return;
      }
      
      const nokData = {
        name: cleanedNextOfKin.fullName,
        relationship: cleanedNextOfKin.relationship,
        phone: cleanedNextOfKin.phone,
        email: cleanedNextOfKin.email,
        address: {
          street: cleanedNextOfKin.address,
        },
        isPrimary: true
      };
      
      const result = await createMemberEmergencyContact(salesforceContactId, nokData);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Next of kin saved successfully!' });
        setNextOfKin(cleanedNextOfKin);
        setOriginalData(prev => ({ ...prev, nextOfKin: cleanedNextOfKin }));
        setEditMode(prev => ({ ...prev, nextOfKin: false }));
        memberDataService.clearCache(salesforceContactId);
        
        // Refresh the cache
        if (refreshMemberInfo) {
          setTimeout(() => {
            console.log('🔄 [MyInformationTab] Refreshing cache after save...');
            refreshMemberInfo();
          }, 500);
        }
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
  if (!salesforceContactId || isLoading || categoryLoading) {
    return <Loading text="Loading your information..." />;
  }
  
  // Loading skeleton component
  const SectionSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-white/20 sm:bg-gray-200 backdrop-blur-sm rounded w-1/3"></div>
        <div className="h-10 bg-white/20 sm:bg-gray-200 backdrop-blur-sm rounded w-24"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 bg-white/20 sm:bg-gray-200 backdrop-blur-sm rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-white/10 sm:bg-gray-100 backdrop-blur-sm rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Close validation modal
  const closeValidationModal = () => {
    setAddressValidationModal({
      isOpen: false,
      addressType: '',
      originalAddress: {},
      suggestedAddress: {},
      onAccept: null
    });
  };

  
  return (
    <div className="my-information-tab relative min-h-screen">
      {/* White Background - Mobile Only */}
      <div className="fixed inset-0 z-0 sm:hidden bg-white">
      </div>
      
      {/* Main Content Container - REDUCED PADDING for edge-to-edge */}
      <div className="relative z-10 bg-transparent sm:bg-gray-50 px-4 sm:p-6 lg:p-8 pt-2 sm:pt-8 pb-6 sm:pb-8">
        {/* Save Message */}
        {saveMessage.text && (
          <Alert 
            type={saveMessage.type} 
            onClose={() => setSaveMessage({ type: '', text: '' })}
          >
            {saveMessage.text}
          </Alert>
        )}
        
        {/* Add the rest of your content here */}
      
{/* Member Status Banner <MemberStatusBanner category={memberCategory} /> */}

{/* Contact Information - Always visible for all member types */}
{isSectionVisible(memberCategory, 'contact') && (
  <>
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
        fieldErrors={fieldErrors}
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Personal Information */}
{isSectionVisible(memberCategory, 'personal') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Addresses */}
{isSectionVisible(memberCategory, 'addresses') && (
  <>
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
        setAddressValidationModal={setAddressValidationModal}
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Family Information - Only for Applicants and Members */}
{isSectionVisible(memberCategory, 'family') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Occupation - Only for Applicants and Members */}
{isSectionVisible(memberCategory, 'occupation') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Medical Information - Only for Applicants and Members */}
{isSectionVisible(memberCategory, 'medical') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Cryopreservation Arrangements - Only for Applicants and Members */}
{isSectionVisible(memberCategory, 'cryoArrangements') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Funding/Life Insurance - Only for Applicants and Members */}
{isSectionVisible(memberCategory, 'funding') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Legal/Will - Only for Applicants and Members */}
{isSectionVisible(memberCategory, 'legal') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
    {sectionSeparator()}
  </>
)}

{/* Next of Kin - Only for Applicants and Members */}
{isSectionVisible(memberCategory, 'nextOfKin') && (
  <>
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
        memberCategory={memberCategory}
      />
    )}
  </>
)}
      
{/* Address Validation Modal - Rendered via Portal at the MyInformationTab level */}
{addressValidationModal.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeValidationModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6 flex items-start justify-between flex-shrink-0 bg-white">
                <div>
                  <h2 className="text-2xl font-medium text-gray-900">
                    Address Validation Required - {addressValidationModal.addressType} Address
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    We found a validated address that's slightly different from what you entered. Please use the suggested address to ensure accurate delivery.
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-6 bg-gray-50">
                <div className="space-y-4">
                  {/* Suggested Address */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-green-500 relative">
                    <div className="absolute -top-3 left-4 bg-white px-2">
                      <span className="text-green-600 text-sm font-medium">Validated Address (Required)</span>
                    </div>
                    <div className="text-gray-900">
                      <p>{addressValidationModal.suggestedAddress.street}</p>
                      <p>{addressValidationModal.suggestedAddress.city}, {addressValidationModal.suggestedAddress.state} {addressValidationModal.suggestedAddress.postalCode}</p>
                      <p>{addressValidationModal.suggestedAddress.country}</p>
                    </div>
                  </div>

                  {/* Original Address */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-300 relative">
                    <div className="absolute -top-3 left-4 bg-white px-2">
                      <span className="text-gray-600 text-sm font-medium">Address You Entered</span>
                    </div>
                    <div className="text-gray-900">
                      <p>{addressValidationModal.originalAddress.street}</p>
                      <p>{addressValidationModal.originalAddress.city}, {addressValidationModal.originalAddress.state} {addressValidationModal.originalAddress.postalCode}</p>
                      <p>{addressValidationModal.originalAddress.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 flex justify-end items-center flex-shrink-0 bg-white">
                <button
                  onClick={() => {
                    if (addressValidationModal.onAccept) {
                      addressValidationModal.onAccept();
                    }
                    closeValidationModal();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#162740] to-[#785683] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-normal"
                >
                  Use Validated Address
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </div>
  );
};

export default MyInformationTab;