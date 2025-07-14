// hooks/useMyInfoData.js
import { useState, useEffect } from 'react';
import { memberDataService } from '../services/memberDataService';
import { getMemberCategory } from '../services/salesforce/memberInfo';
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
} from '../utils/dataFormatting';

export const useMyInfoData = (salesforceContactId, memberInfoData, memberInfoLoaded) => {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [memberCategory, setMemberCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [initializedFromCache, setInitializedFromCache] = useState(false);
  
  // Edit mode states
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
  
  // Data states
  const [personalInfo, setPersonalInfo] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [addresses, setAddresses] = useState({});
  const [familyInfo, setFamilyInfo] = useState({});
  const [occupation, setOccupation] = useState({});
  const [medicalInfo, setMedicalInfo] = useState({});
  const [cryoArrangements, setCryoArrangements] = useState({});
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
  const [legal, setLegal] = useState({});
  const [nextOfKinList, setNextOfKinList] = useState([]);
  
  // Field errors state
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Original data states
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

  // Helper functions
  const mapPublicDisclosure = (sfValue) => {
    if (!sfValue) return '';
    
    const valueLower = sfValue.toLowerCase();
    
    if (valueLower.includes('freely release') || valueLower.includes('authorized to freely')) {
      return 'freely';
    } else if (valueLower.includes('reasonable efforts') || valueLower.includes('confidentiality')) {
      return 'confidential';
    }
    
    return '';
  };
  
  const mapRemainsHandling = (sfValue) => {
    if (!sfValue) return '';
    
    const valueLower = sfValue.toLowerCase();
    
    if (valueLower.includes('delivery') || valueLower.includes('named person')) {
      return 'return';
    } else if (valueLower.includes('research') || valueLower.includes('tissue donation')) {
      return 'donate';
    }
    
    return '';
  };

  // Load member category
  const loadMemberCategory = async () => {
    setCategoryLoading(true);
    try {
      const result = await getMemberCategory(salesforceContactId);
      
      if (result.success) {
        setMemberCategory(result.data.category);
      } else {
        console.error('Failed to load member category:', result.error);
        setMemberCategory('BasicMember');
      }
    } catch (error) {
      console.error('Error loading member category:', error);
      setMemberCategory('BasicMember');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      memberDataService.clearCache(salesforceContactId);
      
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
      
      // Process results
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
      
      // Process personal info
      if (results.personalRes.success && results.personalRes.data) {
        const personalData = results.personalRes.data.data || results.personalRes.data;
        const cleanedPersonal = cleanPersonData(personalData);
        setPersonalInfo(cleanedPersonal);
        setOriginalData(prev => ({ ...prev, personal: cleanedPersonal }));
      }
      
      // Process contact info
      if (results.contactRes.success && results.contactRes.data) {
        const contactData = results.contactRes.data.data || results.contactRes.data;
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
      
      // Process addresses
      if (results.addressRes.success && results.addressRes.data) {
        const addressData = results.addressRes.data.data || results.addressRes.data;
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
      
      // Process family info
      if (results.familyRes.success && results.familyRes.data) {
        const familyData = results.familyRes.data.data || results.familyRes.data;
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
      
      // Process occupation
      if (results.occupationRes.success && results.occupationRes.data) {
        const occupationData = results.occupationRes.data.data || results.occupationRes.data;
        const cleanedOccupation = {
          ...occupationData,
          occupation: cleanString(occupationData.occupation),
          occupationalIndustry: cleanString(occupationData.industry),
          hasMilitaryService: !!(occupationData.militaryService?.branch),
          militaryBranch: cleanString(occupationData.militaryService?.branch || ''),
          servedFrom: occupationData.militaryService?.startYear || '',
          servedTo: occupationData.militaryService?.endYear || ''
        };
        setOccupation(cleanedOccupation);
        setOriginalData(prev => ({ ...prev, occupation: cleanedOccupation }));
      }
      
      // Process medical info
      if (results.medicalRes.success && results.medicalRes.data) {
        const medicalData = results.medicalRes.data.data || results.medicalRes.data;
        const cleanedMedical = cleanDataBeforeSave(medicalData, 'medical');
        setMedicalInfo(cleanedMedical);
        setOriginalData(prev => ({ ...prev, medical: cleanedMedical }));
      }
      
      // Process cryo arrangements
      if (results.cryoRes.success && results.cryoRes.data) {
        const cryoData = results.cryoRes.data.data || results.cryoRes.data;
        const transformedCryo = {
          method: cryoData.methodOfPreservation?.includes('Whole Body') ? 'WholeBody' : 
                  cryoData.methodOfPreservation?.includes('Neuro') ? 'Neuro' : '',
          cmsWaiver: cryoData.cmsWaiver === 'Yes',
          remainsHandling: mapRemainsHandling(cryoData.nonCryoRemainArrangements),
          recipientName: formatPersonName(cryoData.recipientName),
          recipientPhone: formatPhone(cryoData.recipientPhone),
          recipientEmail: formatEmail(cryoData.recipientEmail),
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
      
      // Process legal info
      if (results.legalRes.success && results.legalRes.data) {
        const legalData = results.legalRes.data.data || results.legalRes.data;
        const transformedLegal = {
          hasWill: legalData.hasWill || '',
          willContraryToCryonics: legalData.willContraryToCryonics || ''
        };
        setLegal(transformedLegal);
        setOriginalData(prev => ({ ...prev, legal: transformedLegal }));
      }
      
      // Process emergency contacts
      if (results.emergencyRes.success && results.emergencyRes.data) {
        const emergencyResponse = results.emergencyRes.data;
        const nextOfKinArray = emergencyResponse.data?.nextOfKin || 
                               emergencyResponse.nextOfKin || 
                               emergencyResponse || 
                               [];
        
        if (Array.isArray(nextOfKinArray) && nextOfKinArray.length > 0) {
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
          
          // Compute derived fields
          transformedList.forEach(nok => {
            nok.fullName = `${nok.firstName} ${nok.lastName}`.trim();
            nok.phone = nok.mobilePhone || nok.homePhone || '';
          });
          
          setNextOfKinList(transformedList);
          setOriginalData(prev => ({ ...prev, nextOfKin: transformedList }));
        } else {
          setNextOfKinList([]);
        }
      }
      
      // Process funding
      if (results.fundingRes.success && results.fundingRes.data) {
        const fundingData = results.fundingRes.data.data || results.fundingRes.data;
        setFunding(fundingData);
        setOriginalData(prev => ({ ...prev, funding: fundingData }));
      }
      
    } catch (error) {
      console.error('Error loading member data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit
  const cancelEdit = (section) => {
    switch (section) {
      case 'personal':
        setPersonalInfo(originalData.personal);
        break;
      case 'contact':
        setContactInfo(originalData.contact);
        setPersonalInfo(prev => ({
          ...prev,
          firstName: originalData.personal.firstName || '',
          lastName: originalData.personal.lastName || '',
          dateOfBirth: originalData.personal.dateOfBirth || ''
        }));
        setFieldErrors({});
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
        setNextOfKinList(originalData.nextOfKin || []);
        setFieldErrors({});
        break;
    }
    setEditMode(prev => ({ ...prev, [section]: false }));
    setFieldErrors({});
  };

  // Initialize data
  useEffect(() => {
    if (!salesforceContactId) return;
    
    const initializeData = async () => {
      if (memberInfoLoaded && memberInfoData && !initializedFromCache) {
        // Use cached data
        // [Process cached data - code omitted for brevity]
        setInitializedFromCache(true);
        setIsLoading(false);
      } else if (!memberInfoLoaded) {
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

  return {
    isLoading,
    memberCategory,
    personalInfo,
    setPersonalInfo,
    contactInfo,
    setContactInfo,
    addresses,
    setAddresses,
    familyInfo,
    setFamilyInfo,
    occupation,
    setOccupation,
    medicalInfo,
    setMedicalInfo,
    cryoArrangements,
    setCryoArrangements,
    funding,
    setFunding,
    legal,
    setLegal,
    nextOfKinList,
    setNextOfKinList,
    editMode,
    setEditMode,
    originalData,
    fieldErrors,
    setFieldErrors,
    loadAllData,
    cancelEdit
  };
};