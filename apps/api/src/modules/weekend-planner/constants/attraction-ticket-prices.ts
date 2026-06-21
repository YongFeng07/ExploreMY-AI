// Common Malaysian attraction ticket prices (MYR per adult)
export const ATTRACTION_TICKET_PRICES: Record<string, Record<string, number>> = {
  'Kuala Lumpur': {
    'Petronas Twin Towers': 80,
    'KL Tower': 49,
    'Batu Caves': 0,
    'Aquaria KLCC': 49,
    'KL Bird Park': 35,
    'Islamic Arts Museum': 14,
    'National Museum': 5,
    'Perdana Botanical Gardens': 0,
    'Zoo Negara': 45,
    'Sunway Lagoon': 150,
    'Thean Hou Temple': 0,
    'Central Market': 0,
    'Merdeka Square': 0,
    'KLCC Park': 0,
    'Bukit Nanas Forest Reserve': 0,
  },
  'Penang': {
    'Kek Lok Si Temple': 8,
    'Penang Hill Funicular': 30,
    'Pinang Peranakan Mansion': 20,
    'Cheong Fatt Tze Blue Mansion': 18,
    'Penang National Park': 0,
    'Entopia Butterfly Farm': 49,
    'Penang Botanic Gardens': 0,
    'Fort Cornwallis': 10,
    'Tropical Spice Garden': 25,
    'Penang War Museum': 22,
    'Clan Jetties': 0,
    'Street Art Murals': 0,
    'Batu Ferringhi Beach': 0,
    'Escape Penang': 100,
  },
  'Langkawi': {
    'Langkawi Cable Car': 55,
    'Sky Bridge': 6,
    'Kilim Geoforest Park': 80,
    'Underwater World': 40,
    'Dataran Lang': 0,
    'Tanjung Rhu Beach': 0,
    'Seven Wells Waterfall': 0,
    'Pantai Cenang': 0,
  },
  'Melaka': {
    'A Famosa': 10,
    'St Paul Hill': 0,
    'Melaka River Cruise': 20,
    'Baba Nyonya Heritage Museum': 16,
    'Melaka Sultanate Palace': 10,
    'Jonker Street': 0,
    'Christ Church': 0,
    'Encore Melaka': 80,
    'Taming Sari Tower': 20,
  },
  'Cameron Highlands': {
    'BOH Tea Plantation': 0,
    'Mossy Forest': 10,
    'Strawberry Farms': 5,
    'Lavender Garden': 10,
    'Cactus Valley': 5,
    'Time Tunnel Museum': 5,
  },
  'Johor Bahru': {
    'Legoland Malaysia': 180,
    'Johor Zoo': 2,
    'Sultan Abu Bakar Mosque': 0,
    'Danga Bay': 0,
    'Johor Bahru Old Chinese Temple': 0,
  },
  'Ipoh': {
    'Kellie Castle': 10,
    'Perak Cave Temple': 0,
    'Kek Lok Tong': 0,
    'Lost World of Tambun': 100,
    'Concubine Lane': 0,
    'Qing Xin Ling Leisure Park': 15,
  },
  'default': {
    'museum': 10,
    'temple': 0,
    'beach': 0,
    'park': 0,
    'viewpoint': 0,
    'waterfall': 0,
    'default': 15,
  },
} as const;

export function getTicketPrice(city: string, attractionName: string): number {
  const cityPrices = ATTRACTION_TICKET_PRICES[city] ?? ATTRACTION_TICKET_PRICES['default']!;
  // Fuzzy match: check if attraction name contains any key
  for (const [key, price] of Object.entries(cityPrices)) {
    if (attractionName.toLowerCase().includes(key.toLowerCase())) return price;
  }
  return (cityPrices as Record<string, number>)['default'] ?? 15;
}
