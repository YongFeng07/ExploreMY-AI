// Malaysian highway toll rates (MYR) for key expressways
export const TOLL_RATES: Record<string, { name: string; segments: Record<string, number> }> = {
  PLUS_NORTH: {
    name: 'PLUS North-South Expressway (Northern Route)',
    segments: {
      'KL→Ipoh': 28.80,
      'Ipoh→Penang': 20.80,
      'KL→Penang': 49.60,
      'Penang_Bridge': 7.00,
      'KL→Tapah': 19.50,
      'KL→Sungai_Perak': 35.40,
      'Juru→Skudai': 42.30,
    },
  },
  PLUS_SOUTH: {
    name: 'PLUS North-South Expressway (Southern Route)',
    segments: {
      'KL→Melaka': 19.50,
      'KL→JB': 37.20,
      'KL→Seremban': 10.80,
      'Melaka→JB': 17.70,
      'KL→Nilai': 8.60,
    },
  },
  LPT: {
    name: 'East Coast Expressway (LPT)',
    segments: {
      'KL→Kuantan': 25.50,
      'KL→Kuala_Terengganu': 47.80,
      'Kuantan→KT': 22.30,
    },
  },
  NKVE: {
    name: 'New Klang Valley Expressway',
    segments: {
      'KL→Klang': 8.50,
      'KL→Shah_Alam': 5.60,
      'Damansara→Bukit_Raja': 7.20,
    },
  },
  KESAS: {
    name: 'KESAS Highway',
    segments: {
      'KL→Shah_Alam': 4.50,
      'KL→Klang': 5.80,
      'Subang→Klang': 4.20,
    },
  },
  LDP: {
    name: 'Damansara-Puchong Expressway (LDP)',
    segments: {
      'Damansara→Puchong': 2.10,
      'Puchong→Putrajaya': 2.50,
      'Full_Route': 4.60,
    },
  },
  SPRINT: {
    name: 'SPRINT Expressway',
    segments: {
      'Damansara→Bangsar': 2.00,
      'Damansara→Mont_Kiara': 1.50,
    },
  },
  MEX: {
    name: 'Maju Expressway (MEX)',
    segments: {
      'KL→Putrajaya': 3.50,
      'KL→Cyberjaya': 4.00,
    },
  },
  ELITE: {
    name: 'ELITE Highway (North-South Expressway Central Link)',
    segments: {
      'Shah_Alam→KLIA': 10.50,
      'Shah_Alam→Nilai': 13.80,
    },
  },
  LEKAS: {
    name: 'Kajang-Seremban Highway (LEKAS)',
    segments: {
      'Kajang→Seremban': 7.20,
      'Kajang→Semenyih': 3.00,
    },
  },
} as const;

export interface TollInfo {
  highway: string;
  segment: string;
  cost: number;
}
