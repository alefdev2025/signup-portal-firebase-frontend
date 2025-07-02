// Comprehensive Data Cleaning Utilities
// Handles international addresses and all types of user input data

// ============= GENERAL STRING UTILITIES =============

// Remove extra spaces and trim
const cleanString = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\s+/g, ' ').trim();
  };
  
  // ============= NAME FORMATTING =============
  
  // Format person names (handles international names)
  const formatPersonName = (name) => {
    if (!name) return '';
    
    const cleaned = cleanString(name);
    
    // Prefixes that should stay lowercase (unless at start)
    const prefixes = ['de', 'da', 'di', 'von', 'van', 'der', 'den', 'del', 'della', 'des', 'du', 'la', 'le', 'los', 'das', 'dos'];
    
    // Suffixes that need special handling
    const suffixes = ['Jr', 'Sr', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'MD', 'PhD', 'DDS', 'Esq'];
    
    return cleaned
      .split(' ')
      .map((word, index) => {
        if (!word) return '';
        
        // Check for suffixes (usually uppercase)
        if (suffixes.includes(word.toUpperCase().replace(/\./g, ''))) {
          return word.toUpperCase().replace(/\./g, '');
        }
        
        // Check for prefixes (lowercase unless at start)
        if (index > 0 && prefixes.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        
        // Handle hyphenated names (Marie-Claire, Jean-Paul)
        if (word.includes('-')) {
          return word
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('-');
        }
        
        // Handle apostrophes (O'Brien, D'Angelo)
        if (word.includes("'")) {
          const parts = word.split("'");
          return parts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join("'");
        }
        
        // Handle MacDonald, McDonalds
        if (word.length > 2) {
          if (word.substring(0, 2) === 'Mc') {
            return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
          }
          if (word.substring(0, 3) === 'Mac' && word.length > 5) {
            return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
          }
        }
        
        // Standard case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .filter(word => word)
      .join(' ');
  };
  
  // ============= EMAIL FORMATTING =============
  
  const formatEmail = (email) => {
    if (!email) return '';
    return cleanString(email).toLowerCase();
  };
  
  // ============= PHONE FORMATTING =============
  
  const formatPhone = (phone, country = 'US') => {
    if (!phone) return '';
    
    // Remove all non-numeric characters except + (for international)
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle different country formats
    switch (country) {
      case 'US':
      case 'CA': // North American Numbering Plan
        cleaned = cleaned.replace(/^\+1/, '');
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        break;
        
      case 'UK':
      case 'GB':
        if (cleaned.startsWith('+44')) {
          cleaned = '0' + cleaned.slice(3);
        }
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
          return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
        }
        break;
        
      case 'AU':
        cleaned = cleaned.replace(/^\+61/, '0');
        if (cleaned.length === 10 && cleaned.startsWith('0')) {
          return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
        }
        break;
        
      default:
        // For other countries, just clean and return with international prefix
        if (cleaned.startsWith('+')) {
          return cleaned;
        }
    }
    
    return cleaned;
  };
  
  // ============= ADDRESS FORMATTING =============
  
  // Format street addresses (international aware)
  const formatStreetAddress = (street, country = 'US') => {
    if (!street) return '';
    
    const cleaned = cleanString(street);
    
    // Common abbreviations that should be uppercase
    const abbreviations = ['PO', 'BOX', 'APT', 'STE', 'BLDG', 'FL', 'RM', 'UNIT'];
    
    // Direction abbreviations
    const directions = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW', 'NORTH', 'SOUTH', 'EAST', 'WEST'];
    
    // Street type abbreviations (depends on country)
    const streetTypes = {
      'US': ['ST', 'STREET', 'AVE', 'AVENUE', 'BLVD', 'BOULEVARD', 'RD', 'ROAD', 'DR', 'DRIVE', 
              'CT', 'COURT', 'PL', 'PLACE', 'CIR', 'CIRCLE', 'LN', 'LANE', 'WAY', 'PKY', 'PARKWAY'],
      'UK': ['ST', 'STREET', 'RD', 'ROAD', 'AVE', 'AVENUE', 'CL', 'CLOSE', 'CT', 'COURT', 
              'CRES', 'CRESCENT', 'DR', 'DRIVE', 'GDNS', 'GARDENS', 'GRN', 'GREEN', 'GRV', 'GROVE'],
      'AU': ['ST', 'STREET', 'RD', 'ROAD', 'AVE', 'AVENUE', 'CL', 'CLOSE', 'CT', 'COURT', 
              'CRES', 'CRESCENT', 'DR', 'DRIVE', 'PDE', 'PARADE', 'PL', 'PLACE', 'TCE', 'TERRACE']
    };
    
    const countryStreetTypes = streetTypes[country] || streetTypes['US'];
    
    return cleaned
      .split(' ')
      .map((word, index) => {
        if (!word) return '';
        
        const upperWord = word.toUpperCase();
        
        // Check if it's a number (house number, unit number)
        if (/^\d+[A-Za-z]?$/.test(word)) {
          return word.toUpperCase();
        }
        
        // Check abbreviations
        if (abbreviations.includes(upperWord)) {
          return upperWord;
        }
        
        // Check directions
        if (directions.includes(upperWord)) {
          return upperWord.length <= 2 ? upperWord : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        // Check street types
        if (countryStreetTypes.includes(upperWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        // Handle apartment/unit numbers (e.g., #2A, 2B)
        if (/^#?\d+[A-Z]$/i.test(word)) {
          return word.toUpperCase();
        }
        
        // Handle hyphenated street names
        if (word.includes('-')) {
          return word
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('-');
        }
        
        // Standard title case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .filter(word => word)
      .join(' ');
  };
  
  // Format city names (international aware)
  const formatCity = (city, country = 'US') => {
    if (!city) return '';
    
    const cleaned = cleanString(city);
    
    // Special cases for known cities
    const specialCases = {
      'NEW YORK': 'New York',
      'LOS ANGELES': 'Los Angeles',
      'SAN FRANCISCO': 'San Francisco',
      'WASHINGTON DC': 'Washington DC',
      'ST LOUIS': 'St. Louis',
      'ST PAUL': 'St. Paul',
      // UK
      'STOKE ON TRENT': 'Stoke-on-Trent',
      'STRATFORD UPON AVON': 'Stratford-upon-Avon',
      // International
      'RIO DE JANEIRO': 'Rio de Janeiro',
      'SAO PAULO': 'São Paulo',
    };
    
    const upperCleaned = cleaned.toUpperCase();
    if (specialCases[upperCleaned]) {
      return specialCases[upperCleaned];
    }
    
    // Handle saint abbreviations
    cleaned.replace(/\bST\s+/gi, 'St. ');
    cleaned.replace(/\bSTE\s+/gi, 'Ste. ');
    
    return formatPersonName(cleaned); // Use person name formatter for cities
  };
  
  // Format state/province/region (international aware)
  const formatStateProvince = (state, country = 'US') => {
    if (!state) return '';
    
    const cleaned = cleanString(state);
    
    switch (country) {
      case 'US':
        // US states - if 2 letters, uppercase; otherwise title case
        if (cleaned.length === 2) {
          return cleaned.toUpperCase();
        }
        break;
        
      case 'CA':
        // Canadian provinces
        const canadianProvinces = {
          'ALBERTA': 'AB', 'BRITISH COLUMBIA': 'BC', 'MANITOBA': 'MB',
          'NEW BRUNSWICK': 'NB', 'NEWFOUNDLAND': 'NL', 'NORTHWEST TERRITORIES': 'NT',
          'NOVA SCOTIA': 'NS', 'NUNAVUT': 'NU', 'ONTARIO': 'ON',
          'PRINCE EDWARD ISLAND': 'PE', 'QUEBEC': 'QC', 'SASKATCHEWAN': 'SK', 'YUKON': 'YT'
        };
        
        const upperCleaned = cleaned.toUpperCase();
        if (canadianProvinces[upperCleaned]) {
          return canadianProvinces[upperCleaned];
        }
        if (cleaned.length === 2) {
          return cleaned.toUpperCase();
        }
        break;
        
      case 'AU':
        // Australian states
        const australianStates = {
          'NEW SOUTH WALES': 'NSW', 'VICTORIA': 'VIC', 'QUEENSLAND': 'QLD',
          'SOUTH AUSTRALIA': 'SA', 'WESTERN AUSTRALIA': 'WA', 'TASMANIA': 'TAS',
          'NORTHERN TERRITORY': 'NT', 'AUSTRALIAN CAPITAL TERRITORY': 'ACT'
        };
        
        const upperAU = cleaned.toUpperCase();
        if (australianStates[upperAU]) {
          return australianStates[upperAU];
        }
        if (cleaned.length <= 3) {
          return cleaned.toUpperCase();
        }
        break;
    }
    
    // Default: if short (2-3 chars), uppercase; otherwise title case
    if (cleaned.length <= 3) {
      return cleaned.toUpperCase();
    }
    
    return formatPersonName(cleaned);
  };
  
  // Format postal codes (international aware)
  const formatPostalCode = (postalCode, country = 'US') => {
    if (!postalCode) return '';
    
    const cleaned = cleanString(postalCode);
    
    switch (country) {
      case 'US':
        // US ZIP codes (XXXXX or XXXXX-XXXX)
        const digits = cleaned.replace(/\D/g, '');
        if (digits.length === 5) {
          return digits;
        } else if (digits.length === 9) {
          return `${digits.slice(0, 5)}-${digits.slice(5)}`;
        }
        return digits;
        
      case 'CA':
        // Canadian postal codes (A1A 1A1)
        const canadian = cleaned.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (canadian.length === 6) {
          return `${canadian.slice(0, 3)} ${canadian.slice(3)}`;
        }
        return canadian;
        
      case 'UK':
      case 'GB':
        // UK postcodes (varied formats)
        const uk = cleaned.toUpperCase().replace(/\s+/g, '');
        // Try to format common patterns
        if (uk.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/)) {
          const inward = uk.slice(-3);
          const outward = uk.slice(0, -3);
          return `${outward} ${inward}`;
        }
        return uk;
        
      case 'AU':
        // Australian postcodes (4 digits)
        return cleaned.replace(/\D/g, '').slice(0, 4);
        
      case 'DE':
        // German postcodes (5 digits)
        return cleaned.replace(/\D/g, '').slice(0, 5);
        
      case 'FR':
        // French postcodes (5 digits)
        return cleaned.replace(/\D/g, '').slice(0, 5);
        
      case 'JP':
        // Japanese postcodes (XXX-XXXX)
        const japan = cleaned.replace(/\D/g, '');
        if (japan.length === 7) {
          return `${japan.slice(0, 3)}-${japan.slice(3)}`;
        }
        return japan;
        
      default:
        // Default: just clean and uppercase
        return cleaned.toUpperCase();
    }
  };
  
  // Format country (normalize country names/codes)
  const formatCountry = (country) => {
    if (!country) return '';
    
    const cleaned = cleanString(country).toUpperCase();
    
    // Common country mappings
    const countryMappings = {
      // English variations
      'UNITED STATES': 'US',
      'UNITED STATES OF AMERICA': 'US',
      'USA': 'US',
      'U.S.A.': 'US',
      'U.S.': 'US',
      'AMERICA': 'US',
      'UNITED KINGDOM': 'GB',
      'UK': 'GB',
      'U.K.': 'GB',
      'GREAT BRITAIN': 'GB',
      'ENGLAND': 'GB',
      'SCOTLAND': 'GB',
      'WALES': 'GB',
      'NORTHERN IRELAND': 'GB',
      'CANADA': 'CA',
      'AUSTRALIA': 'AU',
      'NEW ZEALAND': 'NZ',
      'GERMANY': 'DE',
      'FRANCE': 'FR',
      'SPAIN': 'ES',
      'ITALY': 'IT',
      'JAPAN': 'JP',
      'CHINA': 'CN',
      'INDIA': 'IN',
      'MEXICO': 'MX',
      'BRAZIL': 'BR',
      'NETHERLANDS': 'NL',
      'HOLLAND': 'NL',
      'BELGIUM': 'BE',
      'SWITZERLAND': 'CH',
      'AUSTRIA': 'AT',
      'SWEDEN': 'SE',
      'NORWAY': 'NO',
      'DENMARK': 'DK',
      'FINLAND': 'FI',
      'POLAND': 'PL',
      'RUSSIA': 'RU',
      'SOUTH KOREA': 'KR',
      'KOREA': 'KR',
      'SINGAPORE': 'SG',
      'HONG KONG': 'HK',
      'TAIWAN': 'TW',
      'IRELAND': 'IE',
      'PORTUGAL': 'PT',
      'GREECE': 'GR',
      'CZECH REPUBLIC': 'CZ',
      'HUNGARY': 'HU',
      'ROMANIA': 'RO',
      'UKRAINE': 'UA',
      'ISRAEL': 'IL',
      'SAUDI ARABIA': 'SA',
      'UNITED ARAB EMIRATES': 'AE',
      'UAE': 'AE',
      'SOUTH AFRICA': 'ZA',
      'EGYPT': 'EG',
      'TURKEY': 'TR',
      'ARGENTINA': 'AR',
      'CHILE': 'CL',
      'COLOMBIA': 'CO',
      'PERU': 'PE',
      'VENEZUELA': 'VE',
      'PHILIPPINES': 'PH',
      'INDONESIA': 'ID',
      'MALAYSIA': 'MY',
      'THAILAND': 'TH',
      'VIETNAM': 'VN',
    };
    
    // Check if it's a known country name
    if (countryMappings[cleaned]) {
      return countryMappings[cleaned];
    }
    
    // If it's already a 2-letter code, return uppercase
    if (cleaned.length === 2) {
      return cleaned;
    }
    
    // If it's a 3-letter code, return uppercase
    if (cleaned.length === 3) {
      return cleaned;
    }
    
    // Otherwise, return the original cleaned string
    return formatPersonName(country);
  };
  
  // ============= OTHER DATA FORMATTING =============
  
  // Format SSN (US Social Security Number)
  const formatSSN = (ssn, masked = false) => {
    if (!ssn) return '';
    
    const digits = ssn.replace(/\D/g, '');
    
    if (masked && digits.length === 9) {
      return `XXX-XX-${digits.slice(-4)}`;
    }
    
    if (digits.length === 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }
    
    return digits;
  };
  
  // Format date
  const formatDate = (date, format = 'US') => {
    if (!date) return '';
    
    // Parse the date
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Return original if invalid
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'US':
        return `${month}/${day}/${year}`;
      case 'UK':
      case 'GB':
      case 'AU':
        return `${day}/${month}/${year}`;
      case 'ISO':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

    // Format gender/sex values
    const formatGender = (gender) => {
      if (!gender) return '';
      const cleaned = cleanString(gender).toLowerCase();
      
      const genderMap = {
        'male': 'Male',
        'm': 'Male',
        'female': 'Female',
        'f': 'Female',
        'other': 'Other',
        'prefer not to say': 'Prefer not to say'
      };
      
      return genderMap[cleaned] || formatPersonName(gender);
    };

    // Format select/dropdown values (for consistent casing)
    const formatSelectValue = (value) => {
      if (!value) return '';
      
      // For Yes/No/Unknown values
      const cleaned = cleanString(value).toLowerCase();
      if (cleaned === 'yes') return 'Yes';
      if (cleaned === 'no') return 'No';
      if (cleaned === 'unknown') return 'Unknown';
      
      // For other values, use title case
      return formatPersonName(value);
    };

    // Format blood type
    const formatBloodType = (bloodType) => {
      if (!bloodType) return '';
      const cleaned = cleanString(bloodType).toUpperCase();
      
      // Valid blood types
      const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];
      
      if (validTypes.includes(cleaned)) {
        return cleaned === 'UNKNOWN' ? 'Unknown' : cleaned;
      }
      
      return bloodType; // Return original if not recognized
    };

    // Format general text fields (like occupation, hospital name, etc.)
    const formatTextField = (text) => {
      if (!text) return '';
      
      // For general text, convert to proper title case
      const cleaned = cleanString(text);
      return cleaned
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

  // Universal data cleaner that handles all field types
export const cleanDataBeforeSave = (data, dataType) => {
  switch (dataType) {
    case 'personal':
      return {
        firstName: formatPersonName(data.firstName),
        lastName: formatPersonName(data.lastName),
        middleName: formatPersonName(data.middleName),
        birthName: formatPersonName(data.birthName),
        ssn: formatSSN(data.ssn),
        gender: formatGender(data.gender),
        race: formatSelectValue(data.race),
        ethnicity: formatSelectValue(data.ethnicity),
        citizenship: formatCountry(data.citizenship),
        placeOfBirth: formatCity(data.placeOfBirth),
        maritalStatus: formatSelectValue(data.maritalStatus),
        spouseName: formatPersonName(data.spouseName),
        dateOfBirth: data.dateOfBirth // Don't change dates
      };
      
    case 'contact':
      return {
        email: formatEmail(data.email),
        personalEmail: formatEmail(data.personalEmail),
        workEmail: formatEmail(data.workEmail),
        homePhone: formatPhone(data.homePhone),
        mobilePhone: formatPhone(data.mobilePhone),
        workPhone: formatPhone(data.workPhone),
        preferredPhone: formatSelectValue(data.preferredPhone)
      };
      
    case 'addresses':
      const homeCountry = formatCountry(data.homeCountry || 'US');
      const mailingCountry = formatCountry(data.mailingCountry || 'US');
      
      return {
        homeStreet: formatStreetAddress(data.homeStreet, homeCountry),
        homeCity: formatCity(data.homeCity, homeCountry),
        homeState: formatStateProvince(data.homeState, homeCountry),
        homePostalCode: formatPostalCode(data.homePostalCode, homeCountry),
        homeCountry: homeCountry,
        mailingStreet: formatStreetAddress(data.mailingStreet, mailingCountry),
        mailingCity: formatCity(data.mailingCity, mailingCountry),
        mailingState: formatStateProvince(data.mailingState, mailingCountry),
        mailingPostalCode: formatPostalCode(data.mailingPostalCode, mailingCountry),
        mailingCountry: mailingCountry,
        sameAsHome: data.sameAsHome
      };
      
    case 'family':
      return {
        fathersName: formatPersonName(data.fathersName),
        fathersBirthplace: formatCity(data.fathersBirthplace),
        mothersMaidenName: formatPersonName(data.mothersMaidenName),
        mothersBirthplace: formatCity(data.mothersBirthplace),
        spousesName: formatPersonName(data.spousesName)
      };
      
    case 'occupation':
      return {
        occupation: formatTextField(data.occupation),
        occupationalIndustry: formatTextField(data.occupationalIndustry),
        hasMilitaryService: data.hasMilitaryService,
        militaryBranch: formatSelectValue(data.militaryBranch),
        servedFrom: data.servedFrom,
        servedTo: data.servedTo
      };
      
    case 'medical':
      return {
        // Basic health info
        sex: formatGender(data.sex),
        height: data.height || '',
        weight: data.weight || '',
        bloodType: formatBloodType(data.bloodType),
        
        // Doctor info
        primaryPhysician: formatPersonName(data.primaryPhysician),
        physicianAddress: formatStreetAddress(data.physicianAddress),
        physicianCity: formatCity(data.physicianCity),
        physicianState: formatStateProvince(data.physicianState),
        physicianZip: formatPostalCode(data.physicianZip),
        physicianCountry: formatCountry(data.physicianCountry),
        physicianHomePhone: formatPhone(data.physicianHomePhone),
        physicianWorkPhone: formatPhone(data.physicianWorkPhone),
        hospital: formatTextField(data.hospital),
        willDoctorCooperate: formatSelectValue(data.willDoctorCooperate),
        
        // Medical conditions
        healthProblems: cleanString(data.healthProblems),
        allergies: cleanString(data.allergies),
        medications: cleanString(data.medications),
        identifyingScars: cleanString(data.identifyingScars),
        artificialAppliances: cleanString(data.artificialAppliances),
        pastMedicalHistory: cleanString(data.pastMedicalHistory),
        hereditaryIllnesses: cleanString(data.hereditaryIllnesses)
      };
      
    case 'cryoArrangements':
      return {
        ...data,
        recipientName: formatPersonName(data.recipientName),
        recipientPhone: formatPhone(data.recipientPhone),
        recipientEmail: formatEmail(data.recipientEmail),
        recipientAddress: formatStreetAddress(data.recipientAddress)
      };
      
    case 'nextOfKin':
      return {
        fullName: formatPersonName(data.fullName),
        relationship: formatSelectValue(data.relationship),
        phone: formatPhone(data.phone),
        email: formatEmail(data.email),
        address: formatStreetAddress(data.address)
      };
      
    default:
      return data;
  }
};
  
  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount && amount !== 0) return '';
    
    const num = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return '';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(num);
  };
  
  // ============= COMPOSITE CLEANING FUNCTIONS =============
  
  // Clean complete address object
  const cleanAddressObject = (address, country = 'US') => {
    if (!address) return {};
    
    // Determine country from address if provided
    const addressCountry = formatCountry(address.country || country);
    
    return {
      street: formatStreetAddress(address.street, addressCountry),
      city: formatCity(address.city, addressCountry),
      state: formatStateProvince(address.state, addressCountry),
      postalCode: formatPostalCode(address.postalCode, addressCountry),
      country: addressCountry
    };
  };
  
  // Clean person data
  const cleanPersonData = (person) => {
    if (!person) return {};
    
    return {
      ...person,
      firstName: formatPersonName(person.firstName),
      lastName: formatPersonName(person.lastName),
      middleName: formatPersonName(person.middleName),
      birthName: formatPersonName(person.birthName),
      email: formatEmail(person.email),
      personalEmail: formatEmail(person.personalEmail),
      workEmail: formatEmail(person.workEmail),
      homePhone: formatPhone(person.homePhone, person.country),
      mobilePhone: formatPhone(person.mobilePhone, person.country),
      workPhone: formatPhone(person.workPhone, person.country),
      ssn: formatSSN(person.ssn),
      dateOfBirth: formatDate(person.dateOfBirth),
      placeOfBirth: formatCity(person.placeOfBirth),
      citizenship: formatCountry(person.citizenship),
      occupation: cleanString(person.occupation),
      industry: cleanString(person.industry),
      spouseName: formatPersonName(person.spouseName),
      fatherName: formatPersonName(person.fatherName),
      motherMaidenName: formatPersonName(person.motherMaidenName),
      fatherBirthplace: formatCity(person.fatherBirthplace),
      motherBirthplace: formatCity(person.motherBirthplace)
    };
  };
  
  // Clean addresses data (for the AddressesSection component)
  const cleanAddressData = (addresses) => {
    if (!addresses) return {};
    
    const homeCountry = formatCountry(addresses.homeCountry || 'US');
    const mailingCountry = formatCountry(addresses.mailingCountry || addresses.homeCountry || 'US');
    
    return {
      homeStreet: formatStreetAddress(addresses.homeStreet, homeCountry),
      homeCity: formatCity(addresses.homeCity, homeCountry),
      homeState: formatStateProvince(addresses.homeState, homeCountry),
      homePostalCode: formatPostalCode(addresses.homePostalCode, homeCountry),
      homeCountry: homeCountry,
      
      mailingStreet: formatStreetAddress(addresses.mailingStreet, mailingCountry),
      mailingCity: formatCity(addresses.mailingCity, mailingCountry),
      mailingState: formatStateProvince(addresses.mailingState, mailingCountry),
      mailingPostalCode: formatPostalCode(addresses.mailingPostalCode, mailingCountry),
      mailingCountry: mailingCountry,
      
      sameAsHome: addresses.sameAsHome || false
    };
  };

  // Clean medical data with all the new fields
const cleanMedicalData = (medical) => {
  if (!medical) return {};
  
  return {
    ...medical,
    // Basic health info
    sex: cleanString(medical.sex),
    height: medical.height ? parseInt(medical.height) : null,
    weight: medical.weight ? parseInt(medical.weight) : null,
    bloodType: cleanString(medical.bloodType),
    
    // Doctor info
    primaryPhysician: formatPersonName(medical.primaryPhysician),
    physicianAddress: formatStreetAddress(medical.physicianAddress),
    physicianCity: formatCity(medical.physicianCity),
    physicianState: formatStateProvince(medical.physicianState),
    physicianZip: formatPostalCode(medical.physicianZip),
    physicianCountry: formatCountry(medical.physicianCountry),
    physicianHomePhone: formatPhone(medical.physicianHomePhone),
    physicianWorkPhone: formatPhone(medical.physicianWorkPhone),
    hospital: cleanString(medical.hospital),
    willDoctorCooperate: cleanString(medical.willDoctorCooperate),
    
    // Medical conditions
    medicalConditions: cleanString(medical.medicalConditions),
    healthProblems: cleanString(medical.healthProblems),
    allergies: cleanString(medical.allergies),
    medications: cleanString(medical.medications),
    identifyingScars: cleanString(medical.identifyingScars),
    artificialAppliances: cleanString(medical.artificialAppliances),
    pastMedicalHistory: cleanString(medical.pastMedicalHistory),
    hereditaryIllnesses: cleanString(medical.hereditaryIllnesses)
  };
};
  
  // Export all functions
  export {
    // Basic utilities
    cleanString,
    
    // Name formatting
    formatPersonName,
    
    // Contact formatting
    formatEmail,
    formatPhone,
    
    // Address formatting
    formatStreetAddress,
    formatCity,
    formatStateProvince,
    formatPostalCode,
    formatCountry,
    
    // Other formatting
    formatSSN,
    formatDate,
    formatCurrency,
    
    // Composite functions
    cleanAddressObject,
    cleanPersonData,
    cleanAddressData, 

    //medical
    cleanMedicalData
  };