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
  updateMemberFundingInfo,
  getMemberNextOfKin as getMemberEmergencyContacts,
  createMemberNextOfKin as createMemberEmergencyContact,
  updateMemberNextOfKin as updateMemberEmergencyContact,
  deleteMemberNextOfKin as deleteMemberEmergencyContact
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
  cleanComments,
  formatRelationship
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

  const [legal, setLegal] = useState({});
  const [nextOfKinList, setNextOfKinList] = useState([]);
  
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

  const [funding, setFunding] = useState({
    fundingType: '',
    hasMultiplePolicies: false,
    companyName: '',
    policyType: '',
    policyNumber: '',
    faceAmount: null,
    annualPremium: null,
    dateIssued: null,
    termLength: null,
    fundsRecordId: null,
    insuranceRecordId: null
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
        //console.log('📦 [MyInformationTab] Using preloaded member data');
        
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
          console.log('🔍 Cached cryo data:', cryoData);
          
          const transformedCryo = {
            method: cryoData.methodOfPreservation?.includes('Whole Body') ? 'WholeBody' : 
                    cryoData.methodOfPreservation?.includes('Neuro') ? 'Neuro' : '',
            cmsWaiver: cryoData.cmsWaiver === 'Yes',
            remainsHandling: mapRemainsHandling(cryoData.nonCryoRemainArrangements),
            recipientName: formatPersonName(cryoData.recipientName),
            recipientPhone: formatPhone(cryoData.recipientPhone),
            recipientEmail: formatEmail(cryoData.recipientEmail),
            // NEW: Individual recipient mailing address fields
            recipientMailingStreet: formatStreetAddress(cryoData.recipientMailingStreet),
            recipientMailingCity: formatCity(cryoData.recipientMailingCity),
            recipientMailingState: formatStateProvince(cryoData.recipientMailingState),
            recipientMailingPostalCode: formatPostalCode(cryoData.recipientMailingPostalCode),
            recipientMailingCountry: formatCountry(cryoData.recipientMailingCountry),
            cryopreservationDisclosure: mapPublicDisclosure(cryoData.cryopreservationDisclosure),
            memberPublicDisclosure: mapPublicDisclosure(cryoData.memberPublicDisclosure),
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
          console.log('🔍 DEBUG: Cached emergency response:', emergencyResponse);
          console.log('🔍 DEBUG: Type of emergencyResponse:', typeof emergencyResponse);
          console.log('🔍 DEBUG: Keys in emergencyResponse:', Object.keys(emergencyResponse));
          
          // Check different possible data structures
          const nextOfKinArray = emergencyResponse.data?.nextOfKin || 
                                 emergencyResponse.nextOfKin || 
                                 emergencyResponse || // In case the response IS the array
                                 [];
          
          console.log('🔍 DEBUG: nextOfKinArray:', nextOfKinArray);
          console.log('🔍 DEBUG: Is array?', Array.isArray(nextOfKinArray));
          console.log('🔍 DEBUG: Array length:', nextOfKinArray.length);
          
          if (Array.isArray(nextOfKinArray) && nextOfKinArray.length > 0) {
            console.log('🔍 DEBUG: Processing', nextOfKinArray.length, 'NOK records');
            console.log('🔍 DEBUG: First NOK record:', nextOfKinArray[0]);
            
            const transformedList = nextOfKinArray.map(nok => ({
              id: nok.id,
              firstName: formatPersonName(nok.firstName || ''),  // ADD formatting
              middleName: formatPersonName(nok.middleName || ''),  // ADD formatting
              lastName: formatPersonName(nok.lastName || ''),  // ADD formatting
              relationship: formatRelationship(nok.relationship || ''), 
              dateOfBirth: nok.dateOfBirth || '',
              homePhone: formatPhone(nok.homePhone || ''),
              mobilePhone: formatPhone(nok.mobilePhone || ''),
              email: formatEmail(nok.email || ''),
              address: {
                street1: formatStreetAddress(nok.address?.street1 || ''),  // ADD formatting
                street2: formatStreetAddress(nok.address?.street2 || ''),  // ADD formatting
                city: formatCity(nok.address?.city || ''),  // ADD formatting
                state: formatStateProvince(nok.address?.state || ''),  // ADD formatting
                postalCode: formatPostalCode(nok.address?.postalCode || ''),  // ADD formatting
                country: formatCountry(nok.address?.country || '')  // ADD formatting
              },
              willingToSignAffidavit: cleanString(nok.willingToSignAffidavit || ''),  // ADD formatting
              comments: cleanComments(nok.longComments || nok.comments || '')
            }));
            
            // Compute derived fields
            transformedList.forEach(nok => {
              nok.fullName = `${nok.firstName} ${nok.lastName}`.trim();
              nok.phone = nok.mobilePhone || nok.homePhone || '';
            });
            
            console.log('🔍 DEBUG: Transformed list:', transformedList);
            setNextOfKinList(transformedList);
            setOriginalData(prev => ({ ...prev, nextOfKin: transformedList }));
          } else {
            console.log('🔍 DEBUG: No NOK records found or not an array');
            setNextOfKinList([]);
          }
        } else {
          console.log('🔍 DEBUG: No cached emergency data available');
        }
        

        // Remove the misplaced try-catch block that was here
        
        // TODO: probably don't need anymore
        /*if (memberInfoData.insurance?.success && memberInfoData.insurance.data) {
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
        }*/

        if (memberInfoData.funding?.success && memberInfoData.funding.data) {
          const fundingData = memberInfoData.funding.data.data || memberInfoData.funding.data;
          console.log('🔍 Cached funding data:', fundingData);
          setFunding(fundingData);
          setOriginalData(prev => ({ ...prev, funding: fundingData }));
        }

        if (memberInfoData.legal?.success && memberInfoData.legal.data) {
          const legalData = memberInfoData.legal.data.data || memberInfoData.legal.data;
          const transformedLegal = {
            hasWill: legalData.hasWill || '',
            willContraryToCryonics: legalData.willContraryToCryonics || ''
          };
          setLegal(transformedLegal);
          setOriginalData(prev => ({ ...prev, legal: transformedLegal }));
        }
        
        if (memberInfoData.category?.success && memberInfoData.category.data) {
          setMemberCategory(memberInfoData.category.data.category);
          setCategoryLoading(false);
        }
        
        setInitializedFromCache(true);
        setIsLoading(false);
      } else if (!memberInfoLoaded) {
        // No cached data available, load fresh
        //console.log('🔄 [MyInformationTab] No cached data, loading fresh...');
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
        fundingRes
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
        memberDataService.getFundingInfo(salesforceContactId)
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
        fundingRes: fundingRes.status === 'fulfilled' ? fundingRes.value : { success: false } 
      };
      
      // Update states with fetched and cleaned data
      //console.log('API Responses:', results);
      
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
        
        //console.log('🔍 === DEBUG Address Loading ===');
        //console.log('📦 Raw addressData from backend:', addressData);
        
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
        
        //console.log('✨ Cleaned addresses:', cleanedAddresses);
        //console.log('🔍 === END DEBUG ===\n');
        
        setAddresses(cleanedAddresses);
        setOriginalData(prev => ({ ...prev, addresses: cleanedAddresses }));
      }
      
      // Family Info - Clean all family data
      if (results.familyRes.success && results.familyRes.data) {
        console.log('👨‍👩‍👧‍👦 === FAMILY INFO DEBUGGING START ===');
        console.log('📦 Raw familyRes:', results.familyRes);
        console.log('📦 familyRes.data:', results.familyRes.data);
        
        const familyData = results.familyRes.data.data || results.familyRes.data;
        console.log('📦 Extracted familyData:', familyData);
        console.log('📋 Family data type:', typeof familyData);
        console.log('📋 Family data keys:', Object.keys(familyData || {}));
        console.log('📋 Individual fields:');
        console.log('  - fatherName:', familyData.fatherName);
        console.log('  - fatherBirthplace:', familyData.fatherBirthplace);
        console.log('  - motherMaidenName:', familyData.motherMaidenName);
        console.log('  - motherBirthplace:', familyData.motherBirthplace);
        console.log('  - spouseName:', familyData.spouseName);
        
        // Transform and clean family data
        const transformedFamily = {
          fathersName: formatPersonName(familyData.fatherName),
          fathersBirthplace: formatCity(familyData.fatherBirthplace),
          mothersMaidenName: formatPersonName(familyData.motherMaidenName),
          mothersBirthplace: formatCity(familyData.motherBirthplace),
          spousesName: formatPersonName(familyData.spouseName)
        };
        
        console.log('✨ Transformed family data:', transformedFamily);
        console.log('📋 Transformed data keys:', Object.keys(transformedFamily));
        console.log('📋 Transformed values:');
        console.log('  - fathersName:', transformedFamily.fathersName);
        console.log('  - fathersBirthplace:', transformedFamily.fathersBirthplace);
        console.log('  - mothersMaidenName:', transformedFamily.mothersMaidenName);
        console.log('  - mothersBirthplace:', transformedFamily.mothersBirthplace);
        console.log('  - spousesName:', transformedFamily.spousesName);
        
        // Check if formatPersonName and formatCity are working
        console.log('🔍 Testing format functions:');
        console.log('  - formatPersonName("John Doe"):', formatPersonName("John Doe"));
        console.log('  - formatCity("New York, NY, USA"):', formatCity("New York, NY, USA"));
        
        setFamilyInfo(transformedFamily);
        setOriginalData(prev => ({ ...prev, family: transformedFamily }));
        
        console.log('✅ familyInfo state should now be set');
        console.log('👨‍👩‍👧‍👦 === FAMILY INFO DEBUGGING END ===\n');
      } else {
        console.log('❌ === FAMILY INFO FAILED TO LOAD ===');
        console.log('❌ familyRes success:', results.familyRes.success);
        console.log('❌ familyRes error:', results.familyRes.error);
        console.log('❌ Full familyRes:', results.familyRes);
      }
      
      if (results.occupationRes.success && results.occupationRes.data) {
        const occupationData = results.occupationRes.data.data || results.occupationRes.data;
        
        const cleanedOccupation = {
          ...occupationData,
          occupation: cleanString(occupationData.occupation),
          occupationalIndustry: cleanString(occupationData.industry), // Note: backend returns 'industry', not 'occupationalIndustry'
          // Extract military data from the militaryService object
          hasMilitaryService: !!(occupationData.militaryService?.branch),
          militaryBranch: cleanString(occupationData.militaryService?.branch || ''),
          servedFrom: occupationData.militaryService?.startYear || '',
          servedTo: occupationData.militaryService?.endYear || ''
        };
        
        setOccupation(cleanedOccupation);
        setOriginalData(prev => ({ ...prev, occupation: cleanedOccupation }));
      }
      
      // Medical Info - Clean medical data
      if (results.medicalRes.success && results.medicalRes.data) {
        const medicalData = results.medicalRes.data.data || results.medicalRes.data;
        
        // Use cleanDataBeforeSave to properly clean all fields
        const cleanedMedical = cleanDataBeforeSave(medicalData, 'medical');
        
        setMedicalInfo(cleanedMedical);
        setOriginalData(prev => ({ ...prev, medical: cleanedMedical }));
      }
      
      if (results.cryoRes.success && results.cryoRes.data) {
        const cryoData = results.cryoRes.data.data || results.cryoRes.data;
        console.log('🔍 Raw cryo data from API:', cryoData);
        
        // Transform and clean the data
        const transformedCryo = {
          method: cryoData.methodOfPreservation?.includes('Whole Body') ? 'WholeBody' : 
                  cryoData.methodOfPreservation?.includes('Neuro') ? 'Neuro' : '',
          cmsWaiver: cryoData.cmsWaiver === 'Yes',
          remainsHandling: mapRemainsHandling(cryoData.nonCryoRemainArrangements),
          recipientName: formatPersonName(cryoData.recipientName),
          recipientPhone: formatPhone(cryoData.recipientPhone),
          recipientEmail: formatEmail(cryoData.recipientEmail),
          // NEW: Individual recipient mailing address fields
          recipientMailingStreet: formatStreetAddress(cryoData.recipientMailingStreet),
          recipientMailingCity: formatCity(cryoData.recipientMailingCity),
          recipientMailingState: formatStateProvince(cryoData.recipientMailingState),
          recipientMailingPostalCode: formatPostalCode(cryoData.recipientMailingPostalCode),
          recipientMailingCountry: formatCountry(cryoData.recipientMailingCountry),
          cryopreservationDisclosure: mapPublicDisclosure(cryoData.cryopreservationDisclosure),
          memberPublicDisclosure: mapPublicDisclosure(cryoData.memberPublicDisclosure),
          fundingStatus: cryoData.fundingStatus,
          contractDate: cryoData.contractDate,
          memberJoinDate: cryoData.memberJoinDate,
          contractComplete: cryoData.contractComplete,
          isPatient: cryoData.isPatient,
          // Keep recipientAddress for backward compatibility
          recipientAddress: cryoData.recipientAddress
        };
        
        console.log('🔍 Transformed cryo data:', transformedCryo);
        
        setCryoArrangements(transformedCryo);
        setOriginalData(prev => ({ ...prev, cryoArrangements: transformedCryo }));
      }

      // Process Legal Info
      if (results.legalRes.success && results.legalRes.data) {
        const legalData = results.legalRes.data.data || results.legalRes.data;
        console.log('Setting legal info data:', legalData);
        
        const transformedLegal = {
          hasWill: legalData.hasWill || '',
          willContraryToCryonics: legalData.willContraryToCryonics || ''
        };
        
        setLegal(transformedLegal);
        setOriginalData(prev => ({ ...prev, legal: transformedLegal }));
      }
      
      console.log('🔍 DEBUG: emergencyRes from Promise.allSettled:', emergencyRes);
      if (results.emergencyRes.success && results.emergencyRes.data) {
        const emergencyResponse = results.emergencyRes.data;
        console.log('🔍 DEBUG: Emergency response structure:', emergencyResponse);
        console.log('🔍 DEBUG: Type:', typeof emergencyResponse);
        console.log('🔍 DEBUG: Keys:', Object.keys(emergencyResponse));
        
        // Try different data structures
        let nextOfKinArray = [];
        
        // Check if the response has a success flag and nested data
        if (emergencyResponse.success && emergencyResponse.data) {
          console.log('🔍 DEBUG: Found nested data structure');
          nextOfKinArray = emergencyResponse.data.nextOfKin || emergencyResponse.data || [];
        } else if (emergencyResponse.nextOfKin) {
          console.log('🔍 DEBUG: Found direct nextOfKin property');
          nextOfKinArray = emergencyResponse.nextOfKin;
        } else if (Array.isArray(emergencyResponse)) {
          console.log('🔍 DEBUG: Response is already an array');
          nextOfKinArray = emergencyResponse;
        }
        
        console.log('🔍 DEBUG: Final nextOfKinArray:', nextOfKinArray);
        console.log('🔍 DEBUG: Is array?', Array.isArray(nextOfKinArray));
        console.log('🔍 DEBUG: Length:', nextOfKinArray.length);
        
        if (Array.isArray(nextOfKinArray) && nextOfKinArray.length > 0) {
          console.log('🔍 DEBUG: First NOK:', nextOfKinArray[0]);
          
          const transformedList = nextOfKinArray.map(nok => ({
            id: nok.id,
            firstName: formatPersonName(nok.firstName || ''),
            middleName: formatPersonName(nok.middleName || ''),
            lastName: formatPersonName(nok.lastName || ''),
            relationship: formatRelationship(nok.relationship || ''), 
            dateOfBirth: nok.dateOfBirth || '',
            homePhone: formatPhone(nok.homePhone || ''),
            mobilePhone: formatPhone(nok.mobilePhone || ''),
            email: formatEmail(nok.email || ''),
            address: {
              street1: formatStreetAddress(nok.address?.street1 || ''),
              street2: formatStreetAddress(nok.address?.street2 || ''),
              city: formatCity(nok.address?.city || ''),
              state: formatStateProvince(nok.address?.state || ''),
              postalCode: formatPostalCode(nok.address?.postalCode || ''),
              country: formatCountry(nok.address?.country || '')
            },
            willingToSignAffidavit: cleanString(nok.willingToSignAffidavit || ''),
            comments: cleanComments(nok.longComments || nok.comments || '')
          }));
          
          console.log('🔍 DEBUG: Setting transformed list:', transformedList);
          setNextOfKinList(transformedList);
          setOriginalData(prev => ({ ...prev, nextOfKin: transformedList }));
        } else {
          console.log('🔍 DEBUG: No next of kin records found');
          setNextOfKinList([]);
          setOriginalData(prev => ({ ...prev, nextOfKin: [] }));
        }
      } else {
        console.log('🔍 DEBUG: Failed to load emergency contacts');
        console.log('🔍 DEBUG: Success:', results.emergencyRes?.success);
        console.log('🔍 DEBUG: Error:', results.emergencyRes?.error);
        setNextOfKinList([]);
        setOriginalData(prev => ({ ...prev, nextOfKin: [] }));
      }
      
      // TODO: probably don't need
      // Process Insurance (Funding)
      /*if (results.insuranceRes.success && results.insuranceRes.data) {
        const insuranceData = results.insuranceRes.data.data || results.insuranceRes.data;
        //console.log('Setting insurance data:', insuranceData);
        
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
      }*/

      if (results.fundingRes.success && results.fundingRes.data) {
        const fundingData = results.fundingRes.data.data || results.fundingRes.data;
        console.log('Setting funding data:', fundingData);
        setFunding(fundingData);
        setOriginalData(prev => ({ ...prev, funding: fundingData }));
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
    
    if (valueLower.includes('freely release') || valueLower.includes('authorized to freely')) {
      return 'freely';  // Simple code
    } else if (valueLower.includes('reasonable efforts') || valueLower.includes('confidentiality')) {
      return 'confidential';  // Simple code
    }
    
    return '';
  }
  
  function mapRemainsHandling(sfValue) {
    if (!sfValue) return '';
    
    const valueLower = sfValue.toLowerCase();
    
    if (valueLower.includes('delivery') || valueLower.includes('named person')) {
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
  //console.log('🔍 === loadMemberCategory START (Frontend) ===');
  //console.log('📋 Salesforce Contact ID:', salesforceContactId);
  
  setCategoryLoading(true);
  try {
    //console.log('🌐 Calling getMemberCategory API...');
    const result = await getMemberCategory(salesforceContactId);
    //console.log('📦 API Response:', result);
    
    if (result.success) {
      //console.log('✅ Category determined:', result.data.category);
      //console.log('📊 Details:', result.data.details);
      //console.log('🔍 Debug info:', result.data.debug);
      
      setMemberCategory(result.data.category);
      
      // Log what sections will be visible
      //console.log('\n📋 Section Visibility for', result.data.category + ':');
      const config = memberCategoryConfig[result.data.category];
      if (config) {
        Object.keys(config.sections).forEach(section => {
          //console.log(`  - ${section}: ${config.sections[section].visible ? '✓ Visible' : '✗ Hidden'}`);
        });
      }
    } else {
      console.error('❌ Failed to load member category:', result.error);
      //console.log('⚠️ Defaulting to BasicMember');
      setMemberCategory('BasicMember');
    }
  } catch (error) {
    console.error('❌ Error loading member category:', error);
    //console.log('⚠️ Defaulting to BasicMember');
    setMemberCategory('BasicMember');
  } finally {
    setCategoryLoading(false);
    //console.log('🔍 === loadMemberCategory END (Frontend) ===\n');
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
        setNextOfKinList(originalData.nextOfKin || []); // Make sure to use array
        setFieldErrors({}); // Clear field errors when canceling
        break;
    }
    setEditMode(prev => ({ ...prev, [section]: false }));
    // Clear any field errors for all sections
    setFieldErrors({});
  };

  const savePersonalInfo = async () => {
    //console.log('🔵 === START savePersonalInfo ===');
    //console.log('Member category:', memberCategory);
    
    // Store current state for rollback
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('personal');
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.personal?.requiredFields || [];
      //console.log('Required fields for personal section:', requiredFields);
      
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
      
      //console.log('📤 Cleaned data being sent:', JSON.stringify(cleanedData, null, 2));
      
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
        //console.log('⚠️ Partial success - some fields may not have been updated');
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
          //console.log('🔄 [MyInformationTab] Refreshing cache after save...');
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
      //console.log('🔵 === END savePersonalInfo ===\n');
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
      
      //console.log('Starting saveContactInfo with salesforceContactId:', salesforceContactId);
      //console.log('Member category:', memberCategory);
      
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.contact?.requiredFields || [];
      //console.log('Required fields for contact section:', requiredFields);
      
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
        //console.log('No changes detected, skipping save');
        setSavingSection('saved');
        setEditMode(prev => ({ ...prev, contact: false }));
        setTimeout(() => setSavingSection(''), 2000);
        return;
      }
      
      // Validate required fields
      const errors = {};
      
      // Check required fields
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
      
      // Check email formats - simple validation
      if (contactData.personalEmail && !contactData.personalEmail.includes('@')) {
        errors.personalEmail = 'Please enter a valid email address';
      }
      
      if (contactData.workEmail && !contactData.workEmail.includes('@')) {
        errors.workEmail = 'Please enter a valid work email address';
      }
      
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
        setFieldErrors(errors);
        setSavingSection('');
        return;
      }
      
      // Make API calls
      ////console.log('Making API calls...');
      const calls = [];
      
      if (contactChanged) {
        calls.push(updateMemberContactInfo(salesforceContactId, contactData));
      }
      if (personalChanged) {
        calls.push(updateMemberPersonalInfo(salesforceContactId, personalData));
      }
      
      const results = await Promise.all(calls);
      ////console.log('API results:', results);
      
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
          ////console.log('🔄 [MyInformationTab] Refreshing cache after save...');
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
      ////console.log('🚀 === SAVE ADDRESSES START ===');
      ////console.log('Member category:', memberCategory);
      ////console.log('📤 Current addresses state before save:', addresses);
      
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.addresses?.requiredFields || [];
      ////console.log('Required fields for addresses section:', requiredFields);
      
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
      
      ////console.log('📦 Data being sent to backend:', dataToSend);
      
      const result = await updateMemberAddresses(salesforceContactId, dataToSend);
      ////console.log('📨 Save result:', result);
      
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
      ////console.log('🗑️ Clearing cache...');
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
          ////console.log('🔄 [MyInformationTab] Refreshing cache after save...');
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
      ////console.log('🚀 === SAVE ADDRESSES END ===\n');
    }
  };
  
  const saveFamilyInfo = async () => {
    ////console.log('🎯 saveFamilyInfo function called!');
    ////console.log('Current familyInfo state:', familyInfo);
    ////console.log('Current salesforceContactId:', salesforceContactId);
    
    // Store current state for rollback
    const previousFamilyInfo = { ...familyInfo };
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('family');
    setSaveMessage({ type: '', text: '' });
    
    try {
      ////console.log('🚀 === SAVE FAMILY INFO START ===');
      ////console.log('Member category:', memberCategory);
      ////console.log('📤 Current family state before save:', familyInfo);
      //console.log('📤 Current personal state before save:', personalInfo);
      
      // Get required fields for this category
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.family?.requiredFields || [];
      //console.log('Required fields for family section:', requiredFields);
      
      // Check if cleanDataBeforeSave exists
      //console.log('🔍 Checking cleanDataBeforeSave function exists:', typeof cleanDataBeforeSave);
      
      // Clean the family data
      let cleanedFamilyInfo, cleanedPersonalInfo;
      try {
        //console.log('🧹 About to clean family info...');
        cleanedFamilyInfo = cleanDataBeforeSave(familyInfo, 'family');
        //console.log('🧹 Cleaned family info successfully:', cleanedFamilyInfo);
        
        //console.log('🧹 About to clean personal info...');
        cleanedPersonalInfo = cleanDataBeforeSave(personalInfo, 'personal');
        //console.log('🧹 Cleaned personal info successfully:', cleanedPersonalInfo);
      } catch (cleanError) {
        console.error('❌ Error during data cleaning:', cleanError);
        throw cleanError;
      }
      
      // Validate required fields
      const errors = {};
      
      requiredFields.forEach(field => {
        //console.log(`📋 Checking required field: ${field}`);
        switch(field) {
          case 'fathersName':
            if (!cleanedFamilyInfo.fathersName) {
              errors.fathersName = "Father's name is required";
              //console.log('❌ Father\'s name is missing');
            }
            break;
          case 'fathersBirthplace':
            if (!cleanedFamilyInfo.fathersBirthplace || 
                (!cleanedFamilyInfo.fathersBirthplace.includes(',') && 
                 cleanedFamilyInfo.fathersBirthplace.toLowerCase() !== 'unknown' &&
                 cleanedFamilyInfo.fathersBirthplace.length < 10)) {
              errors.fathersBirthplace = "Father's complete birthplace (city, state, country) is required";
              //console.log('❌ Father\'s birthplace is invalid');
            }
            break;
          case 'mothersMaidenName':
            if (!cleanedFamilyInfo.mothersMaidenName) {
              errors.mothersMaidenName = "Mother's maiden name is required";
              //console.log('❌ Mother\'s maiden name is missing');
            }
            break;
          case 'mothersBirthplace':
            if (!cleanedFamilyInfo.mothersBirthplace || 
                (!cleanedFamilyInfo.mothersBirthplace.includes(',') && 
                 cleanedFamilyInfo.mothersBirthplace.toLowerCase() !== 'unknown' &&
                 cleanedFamilyInfo.mothersBirthplace.length < 10)) {
              errors.mothersBirthplace = "Mother's complete birthplace (city, state, country) is required";
              //console.log('❌ Mother\'s birthplace is invalid');
            }
            break;
        }
      });
      
      //console.log('❓ Validation errors:', errors);
      //console.log('❓ Number of errors:', Object.keys(errors).length);
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = Object.values(errors).join('. ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        
        // Rollback state
        setFamilyInfo(previousFamilyInfo);
        setPersonalInfo(previousPersonalInfo);
        //console.log('🔙 Rolled back due to validation errors');
        return;
      }
      
      //console.log('✅ Validation passed, preparing data for API call...');
      
      // Transform data to match backend expectations
      const dataToSend = {
        fatherName: cleanedFamilyInfo.fathersName,
        fatherBirthplace: cleanedFamilyInfo.fathersBirthplace,
        motherMaidenName: cleanedFamilyInfo.mothersMaidenName,
        motherBirthplace: cleanedFamilyInfo.mothersBirthplace,
        // Include spouse name if married
        spouseName: cleanedPersonalInfo.maritalStatus === 'Married' ? cleanedFamilyInfo.spousesName : null
      };
      
      //console.log('📦 Data being sent to backend:', JSON.stringify(dataToSend, null, 2));
      //console.log('📞 Calling updateMemberFamilyInfo with ID:', salesforceContactId);
      
      // Check if updateMemberFamilyInfo exists
      //console.log('🔍 Checking updateMemberFamilyInfo function exists:', typeof updateMemberFamilyInfo);
      
      if (typeof updateMemberFamilyInfo !== 'function') {
        console.error('❌ updateMemberFamilyInfo is not a function!');
        console.error('❌ Type:', typeof updateMemberFamilyInfo);
        console.error('❌ Value:', updateMemberFamilyInfo);
        throw new Error('updateMemberFamilyInfo is not properly imported');
      }
      
      let result;
      try {
        //console.log('📞 === CALLING API NOW ===');
        //console.log(`📞 API URL will be: /api/salesforce/member/${salesforceContactId}/family-info`);
        
        result = await updateMemberFamilyInfo(salesforceContactId, dataToSend);
        
        //console.log('📨 === API CALL COMPLETED ===');
        //console.log('📨 Save result:', result);
        //console.log('📨 Result type:', typeof result);
        //console.log('📨 Result keys:', result ? Object.keys(result) : 'null');
        //console.log('📨 Result success:', result?.success);
        //console.log('📨 Result data:', result?.data);
        //console.log('📨 Result error:', result?.error);
        //console.log('📨 Result partialSuccess:', result?.partialSuccess);
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
      
      //console.log('📊 Update results analysis:');
      //console.log('  - Contact update successful:', contactUpdateSuccessful);
      //console.log('  - Agreement update successful:', agreementUpdateSuccessful);
      //console.log('  - Overall success:', result?.success);
      //console.log('  - Partial success:', result?.partialSuccess);
      
      // If neither update was successful, it's a complete failure
      if (!contactUpdateSuccessful && !agreementUpdateSuccessful && !result?.success) {
        //console.log('❌ Complete save failure - no fields were updated');
        
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
      //console.log('✅ At least partial save successful');
      
      // Determine the appropriate message based on what was saved
      let successMessage = 'Family information saved successfully!';
      let messageType = 'success';
      
      if (result?.partialSuccess && contactUpdateSuccessful && !agreementUpdateSuccessful) {
        // Only contact was updated (common case)
        //console.log('⚠️ Partial success - Contact updated but Agreement update failed');
        // For users, this is still a success - their data is saved
        successMessage = 'Family information saved successfully!';
        messageType = 'success';
      } else if (result?.success) {
        // Both were updated successfully
        //console.log('✅ Complete success - both Contact and Agreement updated');
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
      //console.log('🗑️ Clearing cache...');
      if (typeof memberDataService !== 'undefined' && memberDataService.clearCache) {
        memberDataService.clearCache(salesforceContactId);
        //console.log('✅ Cache cleared');
      } else {
        console.warn('⚠️ memberDataService not available for cache clearing');
      }
      
      // Fetch fresh data to ensure sync - but DON'T overwrite if it fails
      try {
        //console.log('🔄 Fetching fresh data...');
        if (typeof memberDataService !== 'undefined' && memberDataService.getFamilyInfo) {
          const freshData = await memberDataService.getFamilyInfo(salesforceContactId);
          //console.log('📥 Fresh data received:', freshData);
          
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
              //console.log('🔄 Setting refreshed family data:', cleanedFamily);
              setFamilyInfo(cleanedFamily);
              setOriginalData(prev => ({ ...prev, family: cleanedFamily }));
            } else {
              //console.log('⚠️ Fresh data fetch returned empty data, keeping current state');
            }
          } else {
            //console.log('⚠️ Fresh data fetch failed, keeping current state');
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing family data:', refreshError);
        // Non-critical error - data was saved successfully
      }
      
      // Refresh the main cache
      if (refreshMemberInfo) {
        setTimeout(() => {
          //console.log('🔄 [MyInformationTab] Refreshing cache after save...');
          refreshMemberInfo();
        }, 500);
      } else {
        //console.log('⚠️ refreshMemberInfo function not available');
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
      //console.log('🏁 === FINALLY BLOCK ===');
      //console.log('🏁 Current savingSection:', savingSection);
      
      // Keep the 'saved' state for a moment before clearing
      if (savingSection === 'saved') {
        //console.log('🏁 Keeping saved state for 2 seconds...');
        setTimeout(() => {
          //console.log('🏁 Clearing saved state');
          setSavingSection('');
        }, 2000);
      } else {
        //console.log('🏁 Clearing saving state immediately');
        setSavingSection('');
      }
      
      setTimeout(() => {
        //console.log('🏁 Clearing save message after 5 seconds');
        setSaveMessage({ type: '', text: '' });
      }, 5000);
      
      //console.log('🚀 === SAVE FAMILY INFO END ===\n');
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
            //console.log('🔄 [MyInformationTab] Refreshing cache after save...');
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
      //console.log('Saving medical info for member category:', memberCategory);
      
      // Clean the medical data
      const cleanedData = cleanDataBeforeSave(medicalInfo, 'medical');
      
      // Get required fields for this category (if any)
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.medical?.requiredFields || [];
      //console.log('Required fields for medical section:', requiredFields);
      
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
            //console.log('🔄 [MyInformationTab] Refreshing cache after save...');
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
  
// Update the saveCryoArrangements function:
const saveCryoArrangements = async () => {
  setSavingSection('cryoArrangements');
  setSaveMessage({ type: '', text: '' });
  
  try {
    console.log('🔵 === START saveCryoArrangements ===');
    console.log('Current cryo arrangements:', cryoArrangements);
    
    // Clean the cryo arrangements data
    const cleanedCryoArrangements = cleanDataBeforeSave(cryoArrangements, 'cryoArrangements');
    console.log('Cleaned cryo arrangements:', cleanedCryoArrangements);
    
    // Build the update object
    const dataToSend = {};
    
    // Handle the remains handling
    if (cleanedCryoArrangements.remainsHandling) {
      dataToSend.nonCryoRemainArrangements = cleanedCryoArrangements.remainsHandling;
    }
    
    // Handle the disclosures
    if (cleanedCryoArrangements.cryopreservationDisclosure) {
      dataToSend.cryopreservationDisclosure = cleanedCryoArrangements.cryopreservationDisclosure;
    }
    
    if (cleanedCryoArrangements.memberPublicDisclosure) {
      dataToSend.memberPublicDisclosure = cleanedCryoArrangements.memberPublicDisclosure;
    }
    
    // Add recipient fields
    if (cleanedCryoArrangements.recipientName !== undefined) {
      dataToSend.recipientName = cleanedCryoArrangements.recipientName;
    }
    if (cleanedCryoArrangements.recipientPhone !== undefined) {
      dataToSend.recipientPhone = cleanedCryoArrangements.recipientPhone;
    }
    if (cleanedCryoArrangements.recipientEmail !== undefined) {
      dataToSend.recipientEmail = cleanedCryoArrangements.recipientEmail;
    }
    
    // NEW: Add recipient mailing address fields
    if (cleanedCryoArrangements.recipientMailingStreet !== undefined) {
      dataToSend.recipientMailingStreet = cleanedCryoArrangements.recipientMailingStreet;
    }
    if (cleanedCryoArrangements.recipientMailingCity !== undefined) {
      dataToSend.recipientMailingCity = cleanedCryoArrangements.recipientMailingCity;
    }
    if (cleanedCryoArrangements.recipientMailingState !== undefined) {
      dataToSend.recipientMailingState = cleanedCryoArrangements.recipientMailingState;
    }
    if (cleanedCryoArrangements.recipientMailingPostalCode !== undefined) {
      dataToSend.recipientMailingPostalCode = cleanedCryoArrangements.recipientMailingPostalCode;
    }
    if (cleanedCryoArrangements.recipientMailingCountry !== undefined) {
      dataToSend.recipientMailingCountry = cleanedCryoArrangements.recipientMailingCountry;
    }
    
    console.log('📤 Data being sent to backend:', JSON.stringify(dataToSend, null, 2));
    
    const result = await updateMemberCryoArrangements(salesforceContactId, dataToSend);
    console.log('📨 Save result:', result);
    
    if (result.success) {
      setSaveMessage({ 
        type: 'success', 
        text: 'Cryopreservation arrangements saved successfully!' 
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
    console.log('Saving funding for member category:', memberCategory);
    
    // Get required fields for this category
    const requiredFields = memberCategoryConfig[memberCategory]?.sections.funding?.requiredFields || [];
    console.log('Required fields for funding section:', requiredFields);
    
    // Clean the funding data
    const cleanedFunding = cleanDataBeforeSave(funding, 'funding');
    
    // Validate required fields
    const errors = {};
    
    requiredFields.forEach(field => {
      switch(field) {
        case 'fundingType':
          if (!cleanedFunding.fundingType) {
            errors.fundingType = 'Funding type is required';
          }
          break;
        case 'companyName':
          if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.companyName) {
            errors.companyName = 'Insurance company name is required';
          }
          break;
        case 'policyNumber':
          if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.policyNumber) {
            errors.policyNumber = 'Policy number is required';
          }
          break;
        case 'policyType':
          if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.policyType) {
            errors.policyType = 'Policy type is required';
          }
          break;
        case 'faceAmount':
          if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.faceAmount) {
            errors.faceAmount = 'Face amount is required';
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
    
    // Call the new updateMemberFundingInfo function
    const result = await updateMemberFundingInfo(salesforceContactId, cleanedFunding);
    
    if (result.success || result.partialSuccess) {
      if (result.partialSuccess) {
        setSaveMessage({ 
          type: 'warning', 
          text: 'Some funding information was saved, but there were errors: ' + (result.errors || []).join(', ')
        });
      } else {
        setSaveMessage({ type: 'success', text: 'Funding information saved successfully!' });
      }
      
      // Update state with the saved data
      const updatedFunding = {
        ...cleanedFunding,
        fundsRecordId: result.data?.fundsRecordId || funding.fundsRecordId,
        insuranceRecordId: result.data?.insuranceRecordId || funding.insuranceRecordId
      };
      
      setFunding(updatedFunding);
      setOriginalData(prev => ({ ...prev, funding: updatedFunding }));
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
      setSaveMessage({ 
        type: 'error', 
        text: result.error || 'Failed to save funding information' 
      });
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
      
      // Send the string values directly - don't convert to boolean
      const dataToSend = {
        hasWill: cleanedLegal.hasWill || null,  // Keep as "Yes", "No", or null
        willContraryToCryonics: cleanedLegal.willContraryToCryonics || null  // Keep as "Yes", "No", or null
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
            //console.log('🔄 [MyInformationTab] Refreshing cache after save...');
            refreshMemberInfo();
          }, 500);
        }
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save legal information' });
      }
    } catch (error) {
      console.error('Error saving legal info:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to save legal information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };
  
  const saveNextOfKin = async () => {
    // Add a timestamp to track multiple calls
    const callId = Date.now();
    console.log(`🟦 === saveNextOfKin START [${callId}] ===`);
    console.log(`[${callId}] Called from:`, new Error().stack.split('\n')[2]);
    
    setSavingSection('nextOfKin');
    setSaveMessage({ type: '', text: '' });
    setFieldErrors({}); // Clear any existing field errors
    
    try {
      console.log(`[${callId}] 1. memberCategory:`, memberCategory);
      console.log(`[${callId}] 2. memberCategoryConfig exists?`, !!memberCategoryConfig);
      console.log(`[${callId}] 3. salesforceContactId:`, salesforceContactId);
      console.log(`[${callId}] 4. nextOfKinList:`, nextOfKinList);
      console.log(`[${callId}] 5. nextOfKinList details:`, JSON.stringify(nextOfKinList, null, 2));
      
      // Guard against missing memberCategory
      if (!memberCategory) {
        console.error(`[${callId}] ❌ memberCategory is not set!`);
        setSaveMessage({ type: 'error', text: 'Unable to determine member category. Please refresh the page.' });
        setSavingSection('');
        return;
      }
      
      // Get required fields for this category
      let requiredFields = [];
      try {
        requiredFields = memberCategoryConfig[memberCategory]?.sections?.nextOfKin?.requiredFields || [];
        console.log(`[${callId}] 6. Required fields successfully retrieved:`, requiredFields);
      } catch (configError) {
        console.error(`[${callId}] ❌ Error accessing config:`, configError);
        requiredFields = [];
      }
      
      // Validate all Next of Kin entries
      const errors = [];
      const fieldErrorsToSet = {};
      
      console.log(`[${callId}] 7. Starting validation for ${nextOfKinList.length} entries`);
      
      nextOfKinList.forEach((nok, index) => {
        console.log(`[${callId}] 8. Validating NOK ${index + 1}:`, {
          firstName: nok.firstName,
          lastName: nok.lastName,
          relationship: nok.relationship,
          mobilePhone: nok.mobilePhone,
          homePhone: nok.homePhone,
          email: nok.email
        });
        
        const nokErrors = [];
        
        // Validate required fields
        requiredFields.forEach(field => {
          console.log(`[${callId}] 9. Checking field '${field}' for NOK ${index + 1}`);
          
          switch(field) {
            case 'firstName':
              if (!nok.firstName || nok.firstName.trim() === '') {
                console.log(`[${callId}] ❌ First name missing for NOK ${index + 1}`);
                nokErrors.push('First name is required');
                fieldErrorsToSet[`nok_${index}_firstName`] = 'First name is required';
              } else {
                console.log(`[${callId}] ✅ First name OK: ${nok.firstName}`);
              }
              break;
            case 'lastName':
              if (!nok.lastName || nok.lastName.trim() === '') {
                console.log(`[${callId}] ❌ Last name missing for NOK ${index + 1}`);
                nokErrors.push('Last name is required');
                fieldErrorsToSet[`nok_${index}_lastName`] = 'Last name is required';
              } else {
                console.log(`[${callId}] ✅ Last name OK: ${nok.lastName}`);
              }
              break;
            case 'relationship':
              if (!nok.relationship || nok.relationship.trim() === '') {
                console.log(`[${callId}] ❌ Relationship missing for NOK ${index + 1}`);
                nokErrors.push('Relationship is required');
                fieldErrorsToSet[`nok_${index}_relationship`] = 'Relationship is required';
              } else {
                console.log(`[${callId}] ✅ Relationship OK: ${nok.relationship}`);
              }
              break;
            case 'mobilePhone':
              // At least one phone number required
              if (!nok.mobilePhone && !nok.homePhone) {
                console.log(`[${callId}] ❌ No phone numbers for NOK ${index + 1}`);
                nokErrors.push('At least one phone number is required');
                fieldErrorsToSet[`nok_${index}_mobilePhone`] = 'At least one phone number is required';
              } else {
                console.log(`[${callId}] ✅ Phone OK - Mobile: ${nok.mobilePhone}, Home: ${nok.homePhone}`);
              }
              break;
            case 'email':
              if (!nok.email || nok.email.trim() === '') {
                console.log(`[${callId}] ❌ Email missing for NOK ${index + 1}`);
                nokErrors.push('Email is required');
                fieldErrorsToSet[`nok_${index}_email`] = 'Email is required';
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nok.email)) {
                console.log(`[${callId}] ❌ Invalid email format for NOK ${index + 1}: ${nok.email}`);
                nokErrors.push('Please enter a valid email address');
                fieldErrorsToSet[`nok_${index}_email`] = 'Please enter a valid email address';
              } else {
                console.log(`[${callId}] ✅ Email OK: ${nok.email}`);
              }
              break;
            default:
              console.warn(`[${callId}] ⚠️ Unknown required field: ${field}`);
              break;
          }
        });
        
        console.log(`[${callId}] 10. NOK ${index + 1} errors:`, nokErrors);
        
        if (nokErrors.length > 0) {
          errors.push(`Next of Kin ${index + 1}: ${nokErrors.join(', ')}`);
        }
      });
      
      console.log(`[${callId}] 11. Total validation errors:`, errors);
      console.log(`[${callId}] 11a. Field errors to set:`, fieldErrorsToSet);
      
      if (errors.length > 0) {
        console.log(`[${callId}] ❌ Validation failed, showing errors`);
        
        // Set field-specific errors
        setFieldErrors(fieldErrorsToSet);
        
        // Also show a general message at the top
        setSaveMessage({ 
          type: 'error', 
          text: 'Please fill in all required fields' 
        });
        setSavingSection('');
        console.log(`[${callId}] 🟥 === saveNextOfKin END (VALIDATION FAILED) ===`);
        return;
      }
      
      // Find NOKs that need to be deleted
      const currentNokIds = nextOfKinList
        .filter(nok => nok.id && !nok.id.startsWith('temp-'))
        .map(nok => nok.id);
      
      const originalNokIds = (originalData.nextOfKin || [])
        .filter(nok => nok.id && !nok.id.startsWith('temp-'))
        .map(nok => nok.id);
      
      const noksToDelete = originalNokIds.filter(id => !currentNokIds.includes(id));
      
      console.log(`[${callId}] 12. NOKs to delete:`, noksToDelete);
      console.log(`[${callId}]     Original NOK IDs:`, originalNokIds);
      console.log(`[${callId}]     Current NOK IDs:`, currentNokIds);
      console.log(`[${callId}]     Will delete ${noksToDelete.length} NOK(s)`);
      
      // If no Next of Kin and nothing to delete, just close edit mode
      if (nextOfKinList.length === 0 && noksToDelete.length === 0) {
        console.log(`[${callId}] No NOK entries and nothing to delete, closing edit mode`);
        setEditMode(prev => ({ ...prev, nextOfKin: false }));
        setSavingSection('');
        setFieldErrors({}); // Clear any field errors
        console.log(`[${callId}] 🟥 === saveNextOfKin END (NO ENTRIES) ===`);
        return;
      }
      
      console.log(`[${callId}] 13. Preparing to save ${nextOfKinList.length} entries and delete ${noksToDelete.length} entries`);
      
      // Process all operations - deletions, updates, and creates
      const promises = [];
      
      // Add deletion promises first
      noksToDelete.forEach(nokId => {
        console.log(`[${callId}] 14. Adding delete operation for NOK ID: ${nokId}`);
        promises.push(
          deleteMemberEmergencyContact(salesforceContactId, nokId)
            .then(result => {
              console.log(`[${callId}] ✅ Deleted NOK ${nokId}`);
              return result;
            })
            .catch(error => {
              console.error(`[${callId}] ❌ Failed to delete NOK ${nokId}:`, error);
              return { success: false, error: error.message };
            })
        );
      });
      
      // Then add create/update promises
      nextOfKinList.forEach((nok, idx) => {
        console.log(`[${callId}] 15. Preparing NOK ${idx + 1} for API`);
        
        // Ensure we have the computed fields for backend compatibility
        const fullName = `${nok.firstName || ''} ${nok.lastName || ''}`.trim();
        const phone = nok.mobilePhone || nok.homePhone || '';
        
        const nokData = {
          firstName: nok.firstName,
          middleName: nok.middleName || '',
          lastName: nok.lastName,
          fullName: fullName, // Add computed fullName for backend
          relationship: formatRelationship(nok.relationship || ''), 
          dateOfBirth: nok.dateOfBirth || null,
          homePhone: formatPhone(nok.homePhone || ''),  // Format the phone
          mobilePhone: formatPhone(nok.mobilePhone || ''),  // Format the phone
          phone: formatPhone(phone) || '', // Format the computed phone field for backend
          email: nok.email || '',
          address: {
            street1: nok.address?.street1 || '',
            street2: nok.address?.street2 || '',
            city: nok.address?.city || '',
            state: nok.address?.state || '',
            postalCode: nok.address?.postalCode || '',
            country: nok.address?.country || ''
          },
          willingToSignAffidavit: nok.willingToSignAffidavit || '',
          comments: cleanComments(nok.longComments || nok.comments || '')
        };
        
        console.log(`[${callId}] 16. NOK ${idx + 1} data prepared:`, nokData);
        
        if (nok.id && !nok.id.startsWith('temp-')) {
          console.log(`[${callId}] 17. Updating existing NOK ${idx + 1} with ID: ${nok.id}`);
          promises.push(updateMemberEmergencyContact(salesforceContactId, nok.id, nokData));
        } else {
          console.log(`[${callId}] 17. Creating new NOK ${idx + 1}`);
          promises.push(createMemberEmergencyContact(salesforceContactId, nokData));
        }
      });
      
      console.log(`[${callId}] 18. Executing ${promises.length} API calls (${noksToDelete.length} deletes, ${nextOfKinList.length} creates/updates)...`);
      const results = await Promise.all(promises);
      
      console.log(`[${callId}] 19. API results:`, results);
      const allSuccessful = results.every(r => r.success);
      console.log(`[${callId}] 20. All successful?`, allSuccessful);
      
      if (allSuccessful) {
        console.log(`[${callId}] ✅ All saves and deletes successful!`);
        setSaveMessage({ type: 'success', text: 'Next of kin saved successfully!' });
        setEditMode(prev => ({ ...prev, nextOfKin: false }));
        
        // Clear any field errors on successful save
        setFieldErrors({});
        
        // Clear cache after successful save
        memberDataService.clearCache(salesforceContactId);
        
        // Update originalData to match current state
        console.log(`[${callId}] 21. Updating originalData to match current state`);
        console.log(`[${callId}] 22. Current nextOfKinList has ${nextOfKinList.length} entries`);
        
        // The current nextOfKinList already has the correct data
        setOriginalData(prev => ({ ...prev, nextOfKin: [...nextOfKinList] }));
        
        // Try to fetch fresh data after a delay, but don't clear the list if it fails
        setTimeout(async () => {
          try {
            console.log(`[${callId}] 23. Attempting to fetch fresh data (delayed)...`);
            const freshData = await memberDataService.getEmergencyContacts(salesforceContactId);
            
            if (freshData.success && freshData.data) {
              // Check different possible data structures
              const nextOfKinArray = freshData.data?.data?.nextOfKin || 
                                     freshData.data?.nextOfKin || 
                                     freshData.data || 
                                     [];
              
              console.log(`[${callId}] 24. Fresh data received with ${Array.isArray(nextOfKinArray) ? nextOfKinArray.length : 'invalid'} NOKs`);
              
              if (Array.isArray(nextOfKinArray) && nextOfKinArray.length >= 0) {
                const transformedList = nextOfKinArray.map(nok => ({
                  id: nok.id,
                  firstName: formatPersonName(nok.firstName || ''),
                  middleName: formatPersonName(nok.middleName || ''),
                  lastName: formatPersonName(nok.lastName || ''),
                  fullName: `${formatPersonName(nok.firstName || '')} ${formatPersonName(nok.lastName || '')}`.trim(),
                  relationship: cleanString(nok.relationship || ''),
                  dateOfBirth: nok.dateOfBirth || '',
                  homePhone: formatPhone(nok.homePhone || ''),
                  mobilePhone: formatPhone(nok.mobilePhone || ''),
                  phone: nok.mobilePhone || nok.homePhone || '',
                  email: formatEmail(nok.email || ''),
                  address: {
                    street1: formatStreetAddress(nok.address?.street1 || ''),
                    street2: formatStreetAddress(nok.address?.street2 || ''),
                    city: formatCity(nok.address?.city || ''),
                    state: formatStateProvince(nok.address?.state || ''),
                    postalCode: formatPostalCode(nok.address?.postalCode || ''),
                    country: formatCountry(nok.address?.country || '')
                  },
                  willingToSignAffidavit: cleanString(nok.willingToSignAffidavit || ''),
                  comments: cleanComments(nok.longComments || nok.comments || '')
                }));
                
                console.log(`[${callId}] 25. Updating with fresh data - ${transformedList.length} NOKs`);
                setNextOfKinList(transformedList);
                setOriginalData(prev => ({ ...prev, nextOfKin: transformedList }));
              }
            } else {
              console.log(`[${callId}] 26. Could not fetch fresh data, keeping current state`);
            }
          } catch (error) {
            console.log(`[${callId}] 27. Error fetching fresh data (non-critical):`, error.message);
            // This is fine - we already have the correct data in state
          }
        }, 1000); // Delay by 1 second to let the backend settle
        
        // Refresh the main member info cache
        if (refreshMemberInfo) {
          setTimeout(() => {
            console.log(`[${callId}] 🔄 Refreshing main cache...`);
            refreshMemberInfo();
          }, 2000); // Delay this even more
        }
      } else {
        console.log(`[${callId}] ❌ Some saves/deletes failed`);
        // Handle partial failures
        const errorMessages = results
          .map((r, i) => {
            if (!r.success) {
              // Determine if this was a delete or create/update
              if (i < noksToDelete.length) {
                return `Failed to delete Next of Kin: ${r.error || 'Unknown error'}`;
              } else {
                const nokIndex = i - noksToDelete.length;
                const nok = nextOfKinList[nokIndex];
                return `${nok.firstName} ${nok.lastName}: ${r.error || 'Unknown error'}`;
              }
            }
            return null;
          })
          .filter(Boolean);
        
        setSaveMessage({ 
          type: 'error', 
          text: 'Failed to save some next of kin: ' + errorMessages.join(', ') 
        });
        setSavingSection('');
        // Don't clear field errors on failure
      }
      
      console.log(`[${callId}] 🟦 === saveNextOfKin END (SUCCESS) ===`);
    } catch (error) {
      console.error(`[${callId}] ❌ Exception in saveNextOfKin:`, error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to save next of kin: ' + error.message 
      });
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
        setAddressValidationModal={setAddressValidationModal}  // ADD THIS
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
        nextOfKinList={nextOfKinList}
        setNextOfKinList={setNextOfKinList}
        editMode={editMode}
        toggleEditMode={toggleEditMode}
        cancelEdit={cancelEdit}
        saveNextOfKin={saveNextOfKin}
        savingSection={savingSection}
        memberCategory={memberCategory}
        salesforceContactId={salesforceContactId}
        fieldErrors={fieldErrors}  // IMPORTANT: Pass fieldErrors prop
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