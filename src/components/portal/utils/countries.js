// utils/countries.js
import { getName } from 'country-list';

// Stripe supported countries for payments
// Source: https://stripe.com/global
const STRIPE_SUPPORTED_COUNTRIES = [
  'AE', 'AT', 'AU', 'BE', 'BG', 'BR', 'CA', 'CH', 'CY', 'CZ', 'DE',
  'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GI', 'GR', 'HK', 'HR', 'HU',
  'ID', 'IE', 'IN', 'IT', 'JP', 'LI', 'LT', 'LU', 'LV', 'MT', 'MX',
  'MY', 'NL', 'NO', 'NZ', 'PL', 'PT', 'RO', 'SE', 'SG', 'SI', 'SK',
  'TH', 'US'
];

// Countries that require state/province fields
const COUNTRIES_WITH_STATES = ['US', 'CA', 'AU', 'BR', 'IN', 'MX', 'MY', 'NG'];

// State/Province labels by country
export function getStateLabel(countryCode) {
  const labels = {
    'US': 'State',
    'CA': 'Province',
    'AU': 'State/Territory',
    'GB': 'County',
    'IE': 'County',
    'IN': 'State',
    'BR': 'State',
    'MX': 'State',
    'JP': 'Prefecture',
    'IT': 'Province',
    'ES': 'Province',
    'FR': 'Region',
    'DE': 'State',
    'NL': 'Province',
    'BE': 'Province',
    'CH': 'Canton',
    'AT': 'State',
    'MY': 'State'
  };
  return labels[countryCode] || 'State/Province';
}

// Postal code labels by country
export function getZipLabel(countryCode) {
  const labels = {
    'US': 'ZIP Code',
    'CA': 'Postal Code',
    'GB': 'Postcode',
    'AU': 'Postcode',
    'NZ': 'Postcode',
    'IE': 'Eircode',
    'NL': 'Postcode',
    'IN': 'PIN Code'
  };
  return labels[countryCode] || 'Postal Code';
}

// Get placeholder examples for postal codes
export function getZipPlaceholder(countryCode) {
  const placeholders = {
    'US': '10001',
    'CA': 'K1A 0B1',
    'GB': 'SW1A 1AA',
    'AU': '2000',
    'NZ': '1010',
    'IE': 'D02 X285',
    'NL': '1012 JS',
    'DE': '10115',
    'FR': '75001',
    'JP': '100-0001',
    'IN': '110001',
    'BR': '01310-100',
    'MX': '01000'
  };
  return placeholders[countryCode] || '12345';
}

// Main function to get country list
export function getCountries() {
  return STRIPE_SUPPORTED_COUNTRIES
    .map(code => {
      const name = getName(code);
      if (!name) return null; // Skip if country name not found
      
      return {
        code,
        name,
        hasStates: COUNTRIES_WITH_STATES.includes(code),
        stateLabel: getStateLabel(code),
        zipLabel: getZipLabel(code),
        zipPlaceholder: getZipPlaceholder(code)
      };
    })
    .filter(Boolean) // Remove any null entries
    .sort((a, b) => {
      // Put US at the top, then sort alphabetically
      if (a.code === 'US') return -1;
      if (b.code === 'US') return 1;
      return a.name.localeCompare(b.name);
    });
}