// CountryMapper.js
const countryMap = {
    // North America
    'US': 'United States',
    'USA': 'United States',
    'CA': 'Canada',
    'MX': 'Mexico',
    
    // Europe
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'GR': 'Greece',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
    'LU': 'Luxembourg',
    'MT': 'Malta',
    'CY': 'Cyprus',
    'IS': 'Iceland',
    
    // Asia
    'CN': 'China',
    'JP': 'Japan',
    'IN': 'India',
    'KR': 'South Korea',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'SG': 'Singapore',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'HK': 'Hong Kong',
    'TW': 'Taiwan',
    'BD': 'Bangladesh',
    'PK': 'Pakistan',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'MM': 'Myanmar',
    'KH': 'Cambodia',
    'LA': 'Laos',
    'MN': 'Mongolia',
    'BT': 'Bhutan',
    'MV': 'Maldives',
    'AF': 'Afghanistan',
    'IR': 'Iran',
    'IQ': 'Iraq',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'IL': 'Israel',
    'JO': 'Jordan',
    'LB': 'Lebanon',
    'SY': 'Syria',
    'TR': 'Turkey',
    'YE': 'Yemen',
    'OM': 'Oman',
    'QA': 'Qatar',
    'KW': 'Kuwait',
    'BH': 'Bahrain',
    'PS': 'Palestine',
    'GE': 'Georgia',
    'AM': 'Armenia',
    'AZ': 'Azerbaijan',
    'KZ': 'Kazakhstan',
    'UZ': 'Uzbekistan',
    'TM': 'Turkmenistan',
    'KG': 'Kyrgyzstan',
    'TJ': 'Tajikistan',
    
    // Africa
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'GH': 'Ghana',
    'ET': 'Ethiopia',
    'TZ': 'Tanzania',
    'UG': 'Uganda',
    'DZ': 'Algeria',
    'MA': 'Morocco',
    'TN': 'Tunisia',
    'LY': 'Libya',
    'SD': 'Sudan',
    'SS': 'South Sudan',
    'SN': 'Senegal',
    'CI': 'Ivory Coast',
    'CM': 'Cameroon',
    'AO': 'Angola',
    'ZW': 'Zimbabwe',
    'ZM': 'Zambia',
    'MZ': 'Mozambique',
    'MW': 'Malawi',
    'BW': 'Botswana',
    'NA': 'Namibia',
    'RW': 'Rwanda',
    'BI': 'Burundi',
    'SO': 'Somalia',
    'ER': 'Eritrea',
    'DJ': 'Djibouti',
    'GM': 'Gambia',
    'GN': 'Guinea',
    'LR': 'Liberia',
    'SL': 'Sierra Leone',
    'ML': 'Mali',
    'BF': 'Burkina Faso',
    'NE': 'Niger',
    'TD': 'Chad',
    'MR': 'Mauritania',
    'MG': 'Madagascar',
    'BJ': 'Benin',
    'TG': 'Togo',
    'GA': 'Gabon',
    'CG': 'Republic of the Congo',
    'CD': 'Democratic Republic of the Congo',
    'CF': 'Central African Republic',
    'GQ': 'Equatorial Guinea',
    'LS': 'Lesotho',
    'SZ': 'Eswatini',
    'MU': 'Mauritius',
    'SC': 'Seychelles',
    'KM': 'Comoros',
    'CV': 'Cape Verde',
    'ST': 'Sao Tome and Principe',
    'GW': 'Guinea-Bissau',
    
    // Oceania
    'AU': 'Australia',
    'NZ': 'New Zealand',
    'PG': 'Papua New Guinea',
    'FJ': 'Fiji',
    'SB': 'Solomon Islands',
    'VU': 'Vanuatu',
    'NC': 'New Caledonia',
    'PF': 'French Polynesia',
    'WS': 'Samoa',
    'TO': 'Tonga',
    'KI': 'Kiribati',
    'PW': 'Palau',
    'TV': 'Tuvalu',
    'NR': 'Nauru',
    'MH': 'Marshall Islands',
    'FM': 'Micronesia',
    
    // South America
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CO': 'Colombia',
    'PE': 'Peru',
    'VE': 'Venezuela',
    'CL': 'Chile',
    'EC': 'Ecuador',
    'BO': 'Bolivia',
    'PY': 'Paraguay',
    'UY': 'Uruguay',
    'GY': 'Guyana',
    'SR': 'Suriname',
    'GF': 'French Guiana',
    'FK': 'Falkland Islands',
    
    // Caribbean
    'CU': 'Cuba',
    'DO': 'Dominican Republic',
    'HT': 'Haiti',
    'JM': 'Jamaica',
    'TT': 'Trinidad and Tobago',
    'BB': 'Barbados',
    'BS': 'Bahamas',
    'LC': 'Saint Lucia',
    'GD': 'Grenada',
    'VC': 'Saint Vincent and the Grenadines',
    'AG': 'Antigua and Barbuda',
    'DM': 'Dominica',
    'KN': 'Saint Kitts and Nevis',
    'BZ': 'Belize',
    'PR': 'Puerto Rico',
    'BM': 'Bermuda',
    'KY': 'Cayman Islands',
    'VG': 'British Virgin Islands',
    'VI': 'U.S. Virgin Islands',
    'AW': 'Aruba',
    'CW': 'Curacao',
    'SX': 'Sint Maarten',
    'MQ': 'Martinique',
    'GP': 'Guadeloupe',
    'AI': 'Anguilla',
    'TC': 'Turks and Caicos Islands',
    'MS': 'Montserrat',
    
    // Other territories and special cases
    'HM': 'Heard Island and McDonald Islands',
    'CC': 'Cocos (Keeling) Islands',
    'CX': 'Christmas Island',
    'NF': 'Norfolk Island',
    'TK': 'Tokelau',
    'NU': 'Niue',
    'CK': 'Cook Islands',
    'PN': 'Pitcairn Islands',
    'WF': 'Wallis and Futuna',
    'AS': 'American Samoa',
    'GU': 'Guam',
    'MP': 'Northern Mariana Islands',
    'UM': 'United States Minor Outlying Islands',
    'IO': 'British Indian Ocean Territory',
    'GI': 'Gibraltar',
    'JE': 'Jersey',
    'GG': 'Guernsey',
    'IM': 'Isle of Man',
    'FO': 'Faroe Islands',
    'GL': 'Greenland',
    'PM': 'Saint Pierre and Miquelon',
    'YT': 'Mayotte',
    'RE': 'Reunion',
    'BL': 'Saint Barthelemy',
    'MF': 'Saint Martin',
    'TF': 'French Southern Territories',
    'AX': 'Aland Islands',
    'SJ': 'Svalbard and Jan Mayen',
    'BV': 'Bouvet Island',
    'SH': 'Saint Helena',
    'GS': 'South Georgia and the South Sandwich Islands',
    'AQ': 'Antarctica',
    'VA': 'Vatican City',
    'MC': 'Monaco',
    'SM': 'San Marino',
    'LI': 'Liechtenstein',
    'AD': 'Andorra',
    'BY': 'Belarus',
    'MD': 'Moldova',
    'UA': 'Ukraine',
    'RU': 'Russia',
    'BA': 'Bosnia and Herzegovina',
    'ME': 'Montenegro',
    'RS': 'Serbia',
    'MK': 'North Macedonia',
    'AL': 'Albania',
    'XK': 'Kosovo',
    'EH': 'Western Sahara',
    'MO': 'Macau',
    'TL': 'Timor-Leste',
    'BN': 'Brunei'
  };
  
  /**
   * Converts country codes/abbreviations to full country names
   * @param {string} countryCode - The country code or abbreviation (e.g., 'US', 'USA', 'uk')
   * @returns {string} - The full country name or the original input if no mapping found
   */
  export const getCountryFullName = (countryCode) => {
    if (!countryCode) return '';
    
    // Convert to uppercase for case-insensitive matching
    const upperCode = countryCode.toUpperCase().trim();
    
    // Check if it's already a full name (not in our map keys)
    const isAlreadyFullName = !countryMap[upperCode] && countryCode.length > 3;
    if (isAlreadyFullName) return countryCode;
    
    // Return mapped value or original if not found
    return countryMap[upperCode] || countryCode;
  };
  
  /**
   * Processes address data to convert country codes to full names
   * @param {Object} addressData - Object containing address fields
   * @returns {Object} - Address data with country fields converted to full names
   */
  export const normalizeAddressCountries = (addressData) => {
    if (!addressData) return addressData;
    
    const normalized = { ...addressData };
    
    // Normalize home country
    if (normalized.homeCountry) {
      normalized.homeCountry = getCountryFullName(normalized.homeCountry);
    }
    
    // Normalize mailing country
    if (normalized.mailingCountry) {
      normalized.mailingCountry = getCountryFullName(normalized.mailingCountry);
    }
    
    return normalized;
  };
  
  // Export the map itself in case it's needed elsewhere
  export const countryCodeMap = countryMap;
  
  export default {
    getCountryFullName,
    normalizeAddressCountries,
    countryCodeMap
  };