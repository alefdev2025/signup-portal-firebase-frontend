// src/utils/lifeInsuranceCompanyMatcher.js

import insuranceCompanyData from './lifeInsuranceCompanyLinks.json';

/**
 * Normalize a company name for matching
 * @param {string} name - The company name to normalize
 * @returns {string} - Normalized name
 */
const normalizeCompanyName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove common words and punctuation
    .replace(/\b(inc|incorporated|company|co|corp|corporation|llc|ltd)\b/gi, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Find a matching insurance company and return its data
 * @param {string} companyName - The company name to search for
 * @returns {object|null} - Company data with name and URL, or null if not found
 */
export const findInsuranceCompany = (companyName) => {
  if (!companyName) return null;
  
  const normalizedInput = normalizeCompanyName(companyName);
  
  // First, try exact match on main company names
  for (const [key, company] of Object.entries(insuranceCompanyData.companies)) {
    const normalizedKey = normalizeCompanyName(key);
    const normalizedCompanyName = normalizeCompanyName(company.name);
    
    if (normalizedInput === normalizedKey || normalizedInput === normalizedCompanyName) {
      return {
        name: company.name,
        url: company.url,
        matchType: 'exact'
      };
    }
  }
  
  // Then try aliases
  for (const [key, company] of Object.entries(insuranceCompanyData.companies)) {
    for (const alias of company.aliases) {
      const normalizedAlias = normalizeCompanyName(alias);
      if (normalizedInput === normalizedAlias) {
        return {
          name: company.name,
          url: company.url,
          matchType: 'alias'
        };
      }
    }
  }
  
  // Try partial matching (contains)
  for (const [key, company] of Object.entries(insuranceCompanyData.companies)) {
    const normalizedKey = normalizeCompanyName(key);
    
    // Check if input contains the key or key contains the input
    if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
      return {
        name: company.name,
        url: company.url,
        matchType: 'partial'
      };
    }
    
    // Check aliases for partial matches
    for (const alias of company.aliases) {
      const normalizedAlias = normalizeCompanyName(alias);
      if (normalizedInput.includes(normalizedAlias) || normalizedAlias.includes(normalizedInput)) {
        return {
          name: company.name,
          url: company.url,
          matchType: 'partial'
        };
      }
    }
  }
  
  return null;
};

/**
 * Get all insurance companies as an array
 * @returns {array} - Array of company objects
 */
export const getAllInsuranceCompanies = () => {
  return Object.values(insuranceCompanyData.companies).map(company => ({
    name: company.name,
    url: company.url
  })).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Check if a company name exists in our database
 * @param {string} companyName - The company name to check
 * @returns {boolean} - True if company exists
 */
export const hasInsuranceCompany = (companyName) => {
  return findInsuranceCompany(companyName) !== null;
};

// Example usage in React component:
/*
import { findInsuranceCompany } from '../utils/lifeInsuranceCompanyMatcher';

// In your component
const companyMatch = findInsuranceCompany(funding.companyName);

if (companyMatch) {
  return (
    <a 
      href={companyMatch.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {funding.companyName}
    </a>
  );
} else {
  return <span>{funding.companyName}</span>;
}
*/