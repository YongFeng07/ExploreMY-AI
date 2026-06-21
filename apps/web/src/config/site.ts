export const SITE_CONFIG = {
  name: 'ExploreMY AI',
  description: 'AI-powered Malaysia travel discovery platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  defaultCity: { name: 'Kuala Lumpur', lat: 3.139, lng: 101.6869 },
  mapDefaults: { center: { lat: 3.139, lng: 101.6869 }, zoom: 13 },
};
