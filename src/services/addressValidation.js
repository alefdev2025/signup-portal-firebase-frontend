// File: services/addressValidation.js
// Client-side service for validating addresses before form submission

export class AddressValidationService {
    constructor() {
      this.isEnabled = import.meta.env.VITE_ENABLE_ADDRESS_VALIDATION === 'true';
      this.postgridEnabled = import.meta.env.VITE_ENABLE_POSTGRID_VALIDATION === 'true';
    }
  
    /**
     * Validate a single address using PostGrid
     * @param {Object} address - Address object with street, city, state, zipcode
     * @returns {Object} Validation result
     */
    async validateAddress(address) {
      if (!this.isEnabled || !this.postgridEnabled) {
        console.log('📍 Address validation disabled, skipping...');
        return {
          isValid: true,
          note: 'Address validation disabled',
          originalAddress: address
        };
      }
  
      try {
        console.log('📮 Validating address with PostGrid:', address);
  
        const response = await fetch('/api/validate-address-postgrid-with-protection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            street: address.streetAddress || address.street,
            city: address.city,
            state: address.region || address.state,
            zipcode: address.postalCode || address.zipcode
          })
        });
  
        if (!response.ok) {
          throw new Error(`Validation API error: ${response.status}`);
        }
  
        const result = await response.json();
        
        if (result.length > 0) {
          const validated = result[0];
          
          // Log credit usage
          if (validated.creditsUsed > 0) {
            console.log(`💰 PostGrid credits used: ${validated.creditsUsed}, remaining: ${validated.creditsRemaining}`);
          }
  
          return {
            isValid: validated.isValid,
            deliverable: validated.deliverable,
            correctedAddress: validated.correctedAddress,
            service: 'postgrid',
            creditsUsed: validated.creditsUsed || 0,
            creditsRemaining: validated.creditsRemaining || 0,
            details: validated,
            originalAddress: address
          };
        }
  
        return {
          isValid: false,
          error: 'No validation result received',
          originalAddress: address
        };
  
      } catch (error) {
        console.error('Address validation error:', error);
        
        // Return success on error to not block form submission
        return {
          isValid: true,
          error: error.message,
          note: 'Validation service unavailable, address accepted as-is',
          originalAddress: address
        };
      }
    }
  
    /**
     * Validate both home and mailing addresses
     * @param {Object} formData - Form data containing address fields
     * @returns {Object} Validation results for both addresses
     */
    async validateFormAddresses(formData) {
      const results = {
        homeAddress: null,
        mailingAddress: null,
        hasErrors: false,
        errors: []
      };
  
      // Validate home address
      const homeAddress = {
        streetAddress: formData.streetAddress,
        city: formData.city,
        region: formData.region,
        postalCode: formData.postalCode
      };
  
      if (homeAddress.streetAddress && homeAddress.city && homeAddress.region) {
        console.log('🏠 Validating home address...');
        results.homeAddress = await this.validateAddress(homeAddress);
        
        if (!results.homeAddress.isValid) {
          results.hasErrors = true;
          results.errors.push('Home address could not be validated');
        } else if (!results.homeAddress.deliverable) {
          results.errors.push('Home address may not be deliverable');
        }
      }
  
      // Validate mailing address if different
      if (formData.sameMailingAddress === 'No') {
        const mailingAddress = {
          streetAddress: formData.mailingStreetAddress,
          city: formData.mailingCity,
          region: formData.mailingRegion,
          postalCode: formData.mailingPostalCode
        };
  
        if (mailingAddress.streetAddress && mailingAddress.city && mailingAddress.region) {
          console.log('📮 Validating mailing address...');
          results.mailingAddress = await this.validateAddress(mailingAddress);
          
          if (!results.mailingAddress.isValid) {
            results.hasErrors = true;
            results.errors.push('Mailing address could not be validated');
          } else if (!results.mailingAddress.deliverable) {
            results.errors.push('Mailing address may not be deliverable');
          }
        }
      }
  
      return results;
    }
  
    /**
     * Apply corrected addresses to form data
     * @param {Object} formData - Original form data
     * @param {Object} validationResults - Results from validateFormAddresses
     * @returns {Object} Updated form data with corrected addresses
     */
    applyCorrectedAddresses(formData, validationResults) {
      const updatedData = { ...formData };
  
      // Apply home address corrections
      if (validationResults.homeAddress?.correctedAddress) {
        const corrected = validationResults.homeAddress.correctedAddress;
        updatedData.streetAddress = corrected.streetAddress;
        updatedData.city = corrected.city;
        updatedData.region = corrected.region;
        updatedData.postalCode = corrected.postalCode;
        
        console.log('✅ Applied home address corrections');
      }
  
      // Apply mailing address corrections
      if (validationResults.mailingAddress?.correctedAddress) {
        const corrected = validationResults.mailingAddress.correctedAddress;
        updatedData.mailingStreetAddress = corrected.streetAddress;
        updatedData.mailingCity = corrected.city;
        updatedData.mailingRegion = corrected.region;
        updatedData.mailingPostalCode = corrected.postalCode;
        
        console.log('✅ Applied mailing address corrections');
      }
  
      return updatedData;
    }
  }
  
  // Create singleton instance
  export const addressValidationService = new AddressValidationService();