// Melissa API configuration
const MELISSA_API_KEY = 'AVUaS6bp3WJyyFKHjjwqgj**nSAcwXpxhQ0PC2lXxuDAZ-**';
const MELISSA_API_URL = 'https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress';

/**
 * Validates an address using the Melissa API
 * @param {Object} address - Address object with street, city, state, postalCode, country
 * @param {string} addressType - Type of address ('home' or 'mailing')
 * @returns {Promise<{isValid: boolean, invalidFields: Object}>}
 */
export const validateAddressWithMelissa = async (address, addressType) => {
  console.log('🔵 === START validateAddressWithMelissa ===');
  console.log('📋 Address to validate:', addressType, address);
  
  // First check if any required fields are empty
  const emptyFields = {
    street: !address.street || address.street.trim() === '',
    city: !address.city || address.city.trim() === '',
    state: !address.state || address.state.trim() === '',
    postalCode: !address.postalCode || address.postalCode.trim() === ''
  };
  
  // If any required fields are empty, mark only those as invalid
  if (Object.values(emptyFields).some(v => v)) {
    console.log('❌ Empty fields detected:', emptyFields);
    return {
      isValid: false,
      invalidFields: emptyFields
    };
  }
  
  try {
    const params = new URLSearchParams({
      id: MELISSA_API_KEY,
      a1: address.street || '',
      a2: '',
      loc: address.city || '',
      admarea: address.state || '',
      postal: address.postalCode || '',
      ctry: address.country || 'US',
      format: 'json'
    });

    const fullUrl = `${MELISSA_API_URL}?${params}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    console.log('📦 Melissa API Response:', JSON.stringify(data, null, 2));

    // Check for transmission errors
    if (data.TransmissionResults && data.TransmissionResults !== '' && data.TransmissionResults !== 'GE00') {
      console.log('❌ API Error detected');
      // For API errors, we can't determine which field is wrong, so don't mark any
      return { 
        isValid: false,
        invalidFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
      };
    }

    if (data.Version && data.Records && data.Records.length > 0) {
      const record = data.Records[0];
      
      if (record) {
        const addressVerificationCode = record.Results || '';
        console.log('✅ Verification code:', addressVerificationCode);
        
        // ONLY accept AV25, AV24, AV23 - these are fully verified addresses
        const fullyVerifiedCodes = ['AV25', 'AV24', 'AV23'];
        const isFullyVerified = fullyVerifiedCodes.some(code => addressVerificationCode.includes(code));
        
        // Also check for ANY error codes
        const hasErrors = addressVerificationCode.includes('AE') || // Address Error
                         addressVerificationCode.includes('AC') || // Address Change/Correction needed
                         !addressVerificationCode.includes('AV');   // No address verification at all
        
        console.log('📬 Is fully verified?', isFullyVerified);
        console.log('❌ Has errors?', hasErrors);
        
        // Must be fully verified AND have no errors
        const isValid = isFullyVerified && !hasErrors;
        
        // Try to determine which specific field is wrong based on error codes
        let invalidFields = {
          street: false,
          city: false,
          state: false,
          postalCode: false
        };
        
        // Check specific error codes
        if (!isValid) {
          // Check if street is invalid
          if (addressVerificationCode.includes('AE01') || addressVerificationCode.includes('AE02') || 
              addressVerificationCode.includes('AS01') || addressVerificationCode.includes('AS02')) {
            invalidFields.street = true;
          }
          // Check if city is invalid
          else if (addressVerificationCode.includes('AE03') || addressVerificationCode.includes('AE04') ||
                   addressVerificationCode.includes('AS03')) {
            invalidFields.city = true;
          }
          // Check if state is invalid
          else if (addressVerificationCode.includes('AE05') || addressVerificationCode.includes('AE06')) {
            invalidFields.state = true;
          }
          // Check if zip is invalid
          else if (addressVerificationCode.includes('AE07') || addressVerificationCode.includes('AE08') ||
                   addressVerificationCode.includes('AE09') || addressVerificationCode.includes('AE10') ||
                   addressVerificationCode.includes('AE11')) {
            invalidFields.postalCode = true;
          }
          // If we can't determine specific field, don't mark any as red
          else {
            invalidFields = {
              street: false,
              city: false,
              state: false,
              postalCode: false
            };
          }
        }
        
        return { isValid, invalidFields };
      }
    }
    
    console.log('❌ No valid response - address not verified');
    // Can't determine specific field, so don't mark any
    return { 
      isValid: false,
      invalidFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      }
    };
  } catch (error) {
    console.error('❌ Melissa API error:', error);
    // Can't determine specific field, so don't mark any
    return { 
      isValid: false,
      invalidFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      }
    };
  }
};

/**
 * Checks if all required address fields are filled
 * @param {Object} address - Address object
 * @returns {boolean} - True if all required fields are filled
 */
export const isAddressComplete = (address) => {
  return !!(
    address.street && 
    address.city && 
    address.state && 
    address.postalCode
  );
};

/**
 * Formats an address for display
 * @param {string} street - Street address
 * @param {string} city - City
 * @param {string} state - State/Province
 * @param {string} postalCode - Postal code
 * @param {string} country - Country
 * @returns {string} - Formatted address string
 */
export const formatAddress = (street, city, state, postalCode, country) => {
  const parts = [street, city, state, postalCode, country].filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.join(', ');
};