import { statewideLocations } from './statewide.mjs';
export const verifiedOn = '2026-10-25';
export const countySource = 'https://ofm.wa.gov/washington-data-research/county-data';
export const counties = ['Adams','Asotin','Benton','Chelan','Clallam','Clark','Columbia','Cowlitz','Douglas','Ferry','Franklin','Garfield','Grant','Grays Harbor','Island','Jefferson','King','Kitsap','Kittitas','Klickitat','Lewis','Lincoln','Mason','Okanogan','Pacific','Pend Oreille','Pierce','San Juan','Skagit','Skamania','Snohomish','Spokane','Stevens','Thurston','Wahkiakum','Walla Walla','Whatcom','Whitman','Yakima'];
// Verification covers identity and postal address only. These are facilities, not events.
export const locations = [
  { id:'loc_snoisle_edmonds', name:'Edmonds Library', organization:'Sno-Isle Libraries', category:'Library', county:'Snohomish', city:'Edmonds', zip_code:'98020', address:'650 Main St, Edmonds, WA 98020', source_url:'https://sno-isle.bibliocommons.com/v2/locations/' },
  { id:'loc_ymca_everett', name:'Everett Family YMCA', organization:'YMCA of Snohomish County', category:'Community recreation', county:'Snohomish', city:'Everett', zip_code:'98203', address:'4730 Colby Ave, Everett, WA 98203', source_url:'https://ymca-snoco.org/everett-ymca' },
  { id:'loc_spokane_library', name:'Central Library', organization:'Spokane Public Library', category:'Library', county:'Spokane', city:'Spokane', zip_code:'99201', address:'906 W Main Ave, Spokane, WA 99201', source_url:'https://www.spokanelibrary.org/central/' },
  { id:'loc_tacoma_bgc', name:'Henry T. Schatz Branch at the Donald G. Topping Regional HOPE Center', organization:'Boys & Girls Clubs of South Puget Sound', category:'Youth club', county:'Pierce', city:'Tacoma', zip_code:'98409', address:'3875 S 66th St, Tacoma, WA 98409', source_url:'https://www.bgcsps.org/about-us/contact-us' },
  { id:'loc_vancouver_teen', name:'Firstenburg Community Center', organization:'City of Vancouver', category:'Community recreation', county:'Clark', city:'Vancouver', zip_code:null, address:'700 NE 136th Ave, Vancouver, WA', source_url:'https://www.cityofvancouver.us/wp-content/uploads/2023/09/FCC-Age-Guidelines.pdf' },
  ...statewideLocations
];
