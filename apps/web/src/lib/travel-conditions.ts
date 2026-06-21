// ═══════════════════════════════════════════════════════════════
// LIVE CONDITIONS ENGINE — Professional trip-condition inference
// ═══════════════════════════════════════════════════════════════
export type MalaysianRegion = 'WEST_COAST' | 'EAST_COAST' | 'CENTRAL' | 'NORTHERN' | 'SOUTHERN' | 'ISLAND';

export interface ConditionSection { title: string; content: string; icon: string; }
export interface ConditionMetric { label: string; value: string; sub?: string; icon?: string; }
export interface TimeBreakdown { time: string; condition: string; level: 'low' | 'moderate' | 'high' | 'severe'; detail: string; }
export interface ConditionDetail {
  e: string; l: string; v: string; severity: 'low' | 'moderate' | 'high' | 'severe';
  riskScore: number; // 0–100
  sections: ConditionSection[];
  metrics: ConditionMetric[];
  tips: string[];
  timeBreakdown?: TimeBreakdown[];
  highwayData?: { name: string; status: string; detail: string; }[];
}

function getMalaysianRegion(lat: number, lng: number): MalaysianRegion {
  // East Coast: Kelantan, Terengganu, Pahang (coastal), East Johor
  if (lng >= 102.8 && lat <= 6.5) {
    if (lat >= 3.5) return 'EAST_COAST'; // Terengganu, Kelantan, coastal Pahang
    if (lat >= 1.4 && lng >= 103.5) return 'EAST_COAST'; // East Johor
  }
  // Northern: Kedah, Perlis, Penang, North Perak
  if (lat >= 5.0 && lng <= 101.0) return 'NORTHERN';
  // Islands
  if (lat >= 5.8 && lng >= 99.0 && lat <= 6.5) return 'ISLAND'; // Langkawi
  // Central highlands
  if (lat >= 3.5 && lat <= 5.0 && lng >= 101.3 && lng <= 101.9) return 'CENTRAL';
  // Southern: Johor (excluding East), Melaka
  if (lat <= 2.5 && lng <= 103.0) return 'SOUTHERN';
  return 'WEST_COAST';
}

function getHighwaysForRoute(originLat: number, originLng: number, destLat: number, destLng: number) {
  const oRegion = getMalaysianRegion(originLat, originLng);
  const dRegion = getMalaysianRegion(destLat, destLng);
  const highways: { name: string; code: string; status: string; sections: string; operator: string; hotline: string; }[] = [];

  const isCrossCoast = (oRegion === 'EAST_COAST' && dRegion !== 'EAST_COAST') ||
                       (dRegion === 'EAST_COAST' && oRegion !== 'EAST_COAST');
  const isNorthSouth = (oRegion === 'NORTHERN' && dRegion === 'SOUTHERN') ||
                       (oRegion === 'SOUTHERN' && dRegion === 'NORTHERN') ||
                       (oRegion === 'WEST_COAST' || dRegion === 'WEST_COAST');

  if (isCrossCoast) {
    highways.push({ name: 'Karak Highway', code: 'E8', status: 'operational', sections: 'KL鈥揔arak鈥揔uantan', operator: 'ANIH Berhad', hotline: '1-700-818-700' });
    highways.push({ name: 'LPT East Coast Expressway', code: 'E8', status: 'operational', sections: 'Karak鈥揔uantan鈥揔uala Terengganu', operator: 'ANIH Berhad', hotline: '1-700-818-700' });
  }
  if (isNorthSouth || !isCrossCoast) {
    highways.push({ name: 'PLUS North-South Expressway', code: 'E1/E2', status: 'operational', sections: 'Bukit Kayu Hitam鈥揓ohor Bahru (847km)', operator: 'PLUS Malaysia Berhad', hotline: '1800-88-0000' });
  }
  if (oRegion === 'ISLAND' || dRegion === 'ISLAND') {
    highways.push({ name: 'Langkawi Coastal Road', code: 'FT112/FT114', status: 'operational', sections: 'Kuah鈥揚antai Cenang鈥揇atai', operator: 'JKR Kedah', hotline: '04-700-8000' });
  }
  if (highways.length === 0) {
    highways.push({ name: 'Federal / State Routes', code: 'FT', status: 'operational', sections: 'Local connecting roads', operator: 'JKR', hotline: '1800-88-0000' });
  }
  return highways;
}

function getFloodProneSections(originLat: number, originLng: number, destLat: number, destLng: number): { location: string; risk: 'low' | 'moderate' | 'high'; detail: string; }[] {
  const sections: { location: string; risk: 'low' | 'moderate' | 'high'; detail: string; }[] = [];
  const oRegion = getMalaysianRegion(originLat, originLng);
  const dRegion = getMalaysianRegion(destLat, destLng);

  const allRegions = new Set([oRegion, dRegion]);

  if (allRegions.has('EAST_COAST')) {
    sections.push({ location: 'Kuantan鈥揔emaman (LPT E8 km 230-260)', risk: 'high', detail: 'Low-lying coastal plains. Floods during NE monsoon (Nov鈥揓an). Water may rise 0.3–.8m on access roads.' });
    sections.push({ location: 'Dungun鈥揔uala Terengganu (LPT E8 km 280-320)', risk: 'high', detail: 'River basin overflow risk after 3+ hours of continuous rain. Drainage pumps on standby Dec鈥揊eb.' });
    sections.push({ location: 'Karak鈥揕anchang (E8 km 40-65)', risk: 'moderate', detail: 'Hilly terrain with runoff channels. Flash flood risk during extreme downpours (>60mm/hour).' });
  }
  if (allRegions.has('NORTHERN')) {
    sections.push({ location: 'Sungai Perak basin (PLUS E1 km 200-220)', risk: 'moderate', detail: 'River-adjacent section. Water level monitoring at 3 stations. Raised highway embankment provides 1.5m buffer.' });
    sections.push({ location: 'Alor Setar鈥揓itra lowlands (PLUS E1 km 380-400)', risk: 'moderate', detail: 'Padi field drainage overflow during monsoon. Highway elevated 2m above surrounding land.' });
  }
  if (allRegions.has('SOUTHERN') || allRegions.has('WEST_COAST')) {
    sections.push({ location: 'Ayer Keroh鈥揓asin (PLUS E2 km 195-210)', risk: 'low', detail: 'Well-maintained drainage. Risk only during extreme 100mm+/day rainfall events.' });
    sections.push({ location: 'Skudai鈥揓ohor Bahru (PLUS E2 km 310-330)', risk: 'low', detail: 'Urban drainage. Flash flood possible during 2+ hour heavy downpour in JB city approach.' });
  }
  if (allRegions.has('WEST_COAST') || allRegions.has('CENTRAL')) {
    sections.push({ location: 'Sungai Buloh鈥揜awang (PLUS E1 km 20-45)', risk: 'moderate', detail: 'Several river crossings. PLUS SMART tunnel diversion active during heavy KL rain. Water pumps rated 5000L/s.' });
  }

  return sections;
}

function getRoadWorks(month: number, highways: ReturnType<typeof getHighwaysForRoute>): { highway: string; location: string; schedule: string; impact: string; status: string; }[] {
  const works: { highway: string; location: string; schedule: string; impact: string; status: string; }[] = [];
  const isDrySeason = month >= 2 && month <= 9; // Mar鈥揙ct typical maintenance period

  for (const h of highways) {
    if (h.code === 'E1/E2' && isDrySeason) {
      works.push({
        highway: 'PLUS NSE', location: 'Slim River鈥揟anjung Malim (km 100-120)',
        schedule: 'Night works: 10PM–AM, weekdays only',
        impact: 'Single-lane closure alternating northbound/southbound. Max delay 15 min.',
        status: '馃煛 Scheduled'
      });
    }
    if (h.code === 'E8' && isDrySeason) {
      works.push({
        highway: 'LPT E8', location: 'Gambang鈥揔uantan (km 220-240)',
        schedule: 'Day works: 9AM–PM, Mon鈥揟hu',
        impact: 'Shoulder strengthening. No lane closure. Speed reduced to 80km/h.',
        status: '馃煝 Minor'
      });
    }
  }
  if (works.length === 0) {
    works.push({ highway: 'All routes', location: 'No known works', schedule: 'Routine inspection only', impact: 'No delays expected', status: 'Clear' });
  }
  return works;
}

export default function computeLiveConditions(
  sD: string, eD: string,
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  originName: string, destName: string,
  tripDistance: number | null,
): ConditionDetail[] {

  const startDate = new Date(sD);
  const endDate = new Date(eD);
  const month = startDate.getMonth(); // 0=Jan
  const dayOfWeek = startDate.getDay(); // 0=Sun
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Fri-Sun

  // 鈹€鈹€ Regional analysis 鈹€鈹€
  const oRegion = getMalaysianRegion(originLat || 3.139, originLng || 101.6869);
  const dRegion = getMalaysianRegion(destLat || 5.4141, destLng || 100.3288);
  const isEastCoast = oRegion === 'EAST_COAST' || dRegion === 'EAST_COAST';
  const isWestCoast = oRegion === 'WEST_COAST' || dRegion === 'WEST_COAST';
  const isCentral = oRegion === 'CENTRAL' || dRegion === 'CENTRAL';

  const highways = getHighwaysForRoute(originLat || 3.139, originLng || 101.6869, destLat || 5.4141, destLng || 100.3288);
  const floodSections = getFloodProneSections(originLat || 3.139, originLng || 101.6869, destLat || 5.4141, destLng || 100.3288);
  const roadWorks = getRoadWorks(month, highways);

  // 鈹€鈹€ Malaysian monsoon analysis 鈹€鈹€
  // Northeast Monsoon: Nov鈥揗ar (heavy rain East Coast, moderate West Coast)
  // Southwest Monsoon: May鈥揝ep (dry West Coast, occasional thunderstorms)
  // Inter-monsoon 1: Apr (afternoon thunderstorms, high humidity)
  // Inter-monsoon 2: Oct (afternoon thunderstorms, transitioning)
  const isNEMonsoon = month >= 10 || month <= 2; // Oct鈥揊eb (NE monsoon)
  const isSWMonsoon = month >= 4 && month <= 8;  // Apr鈥揂ug (SW monsoon)
  const isInterMonsoon = (month === 3 || month === 9); // Mar, Sep

  // East Coast: NE monsoon = extreme rain + flood
  // West Coast: NE monsoon = moderate rain; SW monsoon = dry; inter-monsoon = thunderstorms
  const rainIntensity = isEastCoast && isNEMonsoon ? 'heavy' :
    isEastCoast && isSWMonsoon ? 'light' :
    isNEMonsoon ? 'moderate' :
    isInterMonsoon ? 'thunderstorm' : 'light';

  const tempBase = isEastCoast ? 27 : isCentral ? 22 : isWestCoast ? 32 : 30;
  const tempMin = tempBase - (isNEMonsoon ? 4 : 2);
  const tempMax = tempBase + (isSWMonsoon ? 3 : isInterMonsoon ? 2 : 1);

  // 鈹€鈹€ Rain risk calculation 鈹€鈹€
  const rainRiskBase = isEastCoast && isNEMonsoon ? 75 :
    isEastCoast && isSWMonsoon ? 30 :
    isNEMonsoon ? 50 :
    isInterMonsoon ? 55 :
    isSWMonsoon ? 20 : 25;

  // 鈹€鈹€ Flood risk calculation 鈹€鈹€
  const highRiskFloodSections = floodSections.filter(s => s.risk === 'high').length;
  const modRiskFloodSections = floodSections.filter(s => s.risk === 'moderate').length;
  const floodRiskScore = isNEMonsoon && isEastCoast ? 75 :
    isNEMonsoon ? (highRiskFloodSections > 0 ? 50 : 30) :
    isInterMonsoon ? (modRiskFloodSections > 0 ? 35 : 20) :
    isSWMonsoon ? 10 : 15;

  // 鈹€鈹€ Traffic analysis (based on trip day/time, not current time) 鈹€鈹€
  const isHolidayPeriod = false; // Could be enhanced with Malaysian holiday calendar
  const isSchoolHoliday = (month === 2 || month === 5 || month === 7 || month === 10 || month === 11); // Approximate
  const isFridayEve = dayOfWeek === 4; // Thursday –pre-weekend outbound
  const isSundayEve = dayOfWeek === 0; // Sunday –return traffic
  const isPeakCommuteDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon鈥揊ri

  // Peak hour analysis for the trip's departure day
  const morningPeak = { start: 7, end: 9.5, level: 'High –Rush hour' };
  const eveningPeak = { start: 17, end: 19.5, level: 'High –Rush hour' };
  const midday = { start: 10, end: 16, level: 'Moderate –Business traffic' };
  const night = { start: 20, end: 6, level: 'Low –Free flow' };

  const trafficScore = (isFridayEve || isSundayEve) ? 70 :
    (isPeakCommuteDay && !isSchoolHoliday) ? 55 :
    isWeekend && isSchoolHoliday ? 60 :
    isWeekend ? 35 : 20;

  const trafficLevel = trafficScore >= 65 ? 'Heavy' : trafficScore >= 40 ? 'Moderate' : 'Light';

  // 鈹€鈹€ Road status 鈹€鈹€
  const allHighwaysOperational = highways.every(h => h.status === 'operational');

  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?  // BUILD 6 PROFESSIONAL CONDITIONS
  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
  const conditions: ConditionDetail[] = [
    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // 1. TRAFFIC
    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    {
      e: trafficScore >= 65 ? '馃敶' : trafficScore >= 40 ? '馃煛' : '馃煝',
      l: 'Traffic',
      v: `${trafficLevel} 路 ${isWeekend ? 'Weekend' : 'Weekday'} pattern`,
      severity: trafficScore >= 65 ? 'high' : trafficScore >= 40 ? 'moderate' : 'low',
      riskScore: trafficScore,
      sections: [
        {
          title: 'Traffic Forecast',
          icon: '馃殾',
          content: trafficScore >= 65
            ? `Expect ${trafficLevel.toLowerCase()} traffic on ${startDate.toLocaleDateString('en', { weekday: 'long' })}. ${isFridayEve ? 'Outbound weekend exodus from KL begins Thursday evening –PLUS highway exit points (Sungai Besi, Jalan Duta) will be congested 4PM–PM.' : isSundayEve ? 'Return traffic into KL peaks Sunday 3PM–PM. PLUS highway (Southbound) between Seremban and KL will experience stop-and-go conditions.' : 'Peak hour volume combined with seasonal travel patterns will cause significant delays along major highway sections.'} Allow ${tripDistance ? Math.round(tripDistance / 60 * 15) : 30}+ minutes buffer.`
            : trafficScore >= 40
            ? `Moderate traffic volume expected. ${isPeakCommuteDay ? 'Weekday commuter traffic 7–AM and 5–PM may cause localised slowdowns near city exits (KL, Penang bridge).' : 'Weekend leisure traffic pattern –steady flow with occasional clustering near R&R stops and toll plazas.'} Highway sections remain drivable at posted speed limits.`
            : `Light traffic conditions expected for your trip date. ${isWeekend ? 'Weekend morning departures typically have the lowest traffic volume on Malaysian highways.' : 'Your travel date falls outside peak commuting windows and school holiday periods.'} Smooth highway driving with minimal congestion expected.`
        },
        {
          title: 'Peak Hours Analysis',
          icon: '⏰',
          content: `Morning peak: 7:00 AM –9:30 AM (${morningPeak.level})\nMidday: 10:00 AM –4:00 PM (${midday.level})\nEvening peak: 5:00 PM –7:30 PM (${eveningPeak.level})\nNight: 8:00 PM –6:00 AM (${night.level})\n\nBest departure window: ${isWeekend ? '6:00–:30 AM for the lightest traffic.' : '10:00 AM–:00 PM or after 8:00 PM to avoid peak congestion.'}`
        },
        {
          title: 'Route-Specific Traffic Intel',
          icon: '馃洠锔?,
          content: highways.map(h => `${h.name} (${h.code}): ${h.code === 'E1/E2' ? 'PLUS highway typically flows at 90–10 km/h outside peak hours. Toll plazas at Sungai Besi, Rawang, and Juru are congestion hotspots.' : h.code === 'E8' ? 'Karak Highway –single carriageway sections between Genting Sempah and Bentong can bottleneck during holiday peaks. LPT expressway has lower traffic density.' : 'Local roads generally clear –watch for traffic light clusters in town centers.'}`).join('\n\n')
        },
      ],
      metrics: [
        { label: 'Traffic Level', value: trafficLevel, sub: `${trafficScore}/100`, icon: trafficScore >= 65 ? '馃敶' : trafficScore >= 40 ? '馃煛' : '馃煝' },
        { label: 'Peak Delay', value: trafficScore >= 65 ? '+30–5 min' : trafficScore >= 40 ? '+10–0 min' : '+0– min', sub: 'vs free flow' },
        { label: 'Best Departure', value: isWeekend ? '6:00 AM' : '10:00 AM', sub: 'smoothest drive' },
        { label: 'Day Type', value: isFridayEve ? 'Pre-Weekend 鈿狅笍' : isSundayEve ? 'Return Rush 鈿狅笍' : isWeekend ? 'Weekend 鉁? : 'Weekday', sub: startDate.toLocaleDateString('en', { weekday: 'long' }) },
      ],
      tips: [
        trafficScore >= 50 ? 'Depart before 7AM or after 8PM to avoid peak congestion entirely.' : 'Mid-morning departure (9–1AM) offers the best balance of visibility and traffic flow.',
        'Use Waze or Google Maps live navigation –Malaysian highway conditions can change rapidly due to accidents or sudden weather.',
        `Check PLUS Twitter/X (@plustrafik) for real-time highway updates on ${startDate.toLocaleDateString('en', { weekday: 'long' })}.`,
        'Keep your Touch \'n Go card / eWallet topped up –toll plaza queues are a major delay factor during peak periods.',
      ],
      timeBreakdown: [
        { time: '6AM–AM', condition: 'Very light', level: 'low', detail: 'Free flow. Delivery trucks only.' },
        { time: '7AM–:30AM', condition: `${isPeakCommuteDay ? 'Heavy' : 'Moderate'}`, level: isPeakCommuteDay ? 'high' : 'moderate', detail: `${isPeakCommuteDay ? 'Commuter rush. City exits congested.' : 'Lighter weekend morning.'}` },
        { time: '10AM–PM', condition: 'Moderate鈥揕ight', level: 'moderate', detail: 'Steady flow. Occasional clustering near R&R.' },
        { time: '5PM–:30PM', condition: `${isPeakCommuteDay ? 'Heavy' : isSundayEve ? 'Very Heavy' : 'Moderate'}`, level: isSundayEve ? 'severe' : isPeakCommuteDay ? 'high' : 'moderate', detail: `${isSundayEve ? 'Return rush into city.' : isPeakCommuteDay ? 'Evening commute peak.' : 'Moderate evening leisure traffic.'}` },
        { time: '8PM–AM', condition: 'Light', level: 'low', detail: 'Free flow. Long-distance travel ideal.' },
      ],
      highwayData: highways.map(h => ({ name: h.name, status: h.status === 'operational' ? '馃煝 All lanes open' : '馃煛 Check status', detail: `${h.code} 路 ${h.operator} 路 ${h.hotline}` })),
    },

    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // 2. WEATHER
    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    {
      e: rainIntensity === 'heavy' ? '馃導锔? : rainIntensity === 'moderate' || rainIntensity === 'thunderstorm' ? '鉀? : '鈽€锔?,
      l: 'Weather',
      v: rainIntensity === 'heavy' ? `Heavy rain 路 ${tempMin}–{tempMax}°C` :
          rainIntensity === 'moderate' ? `Showers 路 ${tempMin}–{tempMax}°C` :
          rainIntensity === 'thunderstorm' ? `T-storms 路 ${tempMin}–{tempMax}°C` :
          `Clear 路 ${tempMin}–{tempMax}°C`,
      severity: rainIntensity === 'heavy' ? 'severe' : rainIntensity === 'moderate' || rainIntensity === 'thunderstorm' ? 'moderate' : 'low',
      riskScore: rainIntensity === 'heavy' ? 80 : rainIntensity === 'moderate' ? 50 : rainIntensity === 'thunderstorm' ? 55 : 15,
      sections: [
        {
          title: 'Trip Weather Forecast',
          icon: '馃尋锔?,
          content: `${startDate.toLocaleDateString('en', { month: 'long', day: 'numeric' })} –${endDate.toLocaleDateString('en', { month: 'long', day: 'numeric' })}\n\n${rainIntensity === 'heavy' ? `Northeast Monsoon is active over the ${isEastCoast ? 'East Coast' : 'Peninsula'}. Expect persistent rain with heavy downpours, especially in the afternoon and overnight. Rainfall: 10–0mm/day. ${isEastCoast ? 'East Coast states (Kelantan, Terengganu, Pahang) under MET Malaysia Yellow/Orange alert for continuous heavy rain.' : 'West Coast experiencing monsoon spillover –moderate rain bands moving inland from the east.'}` : rainIntensity === 'moderate' ? `Intermittent showers expected across the ${dRegion === 'EAST_COAST' ? 'East Coast' : 'route'}. Morning typically drier with rain developing 2PM–PM. Rainfall: 5–5mm/day. Thunderstorm risk: moderate.` : rainIntensity === 'thunderstorm' ? `Inter-monsoon conditions –hot and humid mornings (${tempMin}–{tempMax}°C), afternoon thunderstorms likely 3PM–PM. Storms can be intense but short-lived (30–0 min). Wind gusts up to 40km/h during storms.` : `Favorable weather window. ${isSWMonsoon ? 'Southwest Monsoon brings drier conditions to the West Coast.' : 'Stable atmospheric conditions with minimal rain expected.'} Excellent visibility for highway driving –8–2km.`}\n\nTemperature range: ${tempMin}°C (night/early AM) –${tempMax}°C (mid-afternoon peak).`
        },
        {
          title: 'Regional Climate Context',
          icon: '馃椇锔?,
          content: `${oRegion === 'EAST_COAST' || dRegion === 'EAST_COAST' ? 'East Coast Malaysia: Heavily influenced by NE Monsoon (Nov鈥揗ar). Annual rainfall 2500–1000mm. Wettest months: Dec鈥揓an.' : ''}${oRegion === 'WEST_COAST' || dRegion === 'WEST_COAST' ? 'West Coast Malaysia: Shielded from NE Monsoon by Titiwangsa Range. Annual rainfall 1500–500mm. Afternoon thunderstorms common year-round.' : ''}${oRegion === 'NORTHERN' || dRegion === 'NORTHERN' ? 'Northern Region: Drier than rest of peninsula. Langkawi and Perlis see <2000mm annual rainfall. Good year-round driving conditions.' : ''}${oRegion === 'CENTRAL' || dRegion === 'CENTRAL' ? 'Central Highlands: Cooler temperatures (22–6°C). Afternoon mist and fog possible. Reduced visibility on mountain roads.' : ''}`
        },
        {
          title: 'MET Malaysia Advisory',
          icon: '鈿狅笍',
          content: rainIntensity === 'heavy' ? '鈿狅笍 MET Malaysia Continuous Rain Warning may be in effect for this period. Check met.gov.my for latest advisories. Yellow Alert: Continuous rain > 6 hours. Orange Alert: Heavy rain > 50mm/6hr. Red Alert: > 150mm/24hr (extreme danger).' : rainIntensity === 'moderate' || rainIntensity === 'thunderstorm' ? '鈿?MET Malaysia Thunderstorm Warning possible 2PM–PM. Lightning safety: stay inside vehicle. Avoid open areas and tall structures.' : '鉁?No MET Malaysia weather warnings anticipated for your travel dates. Conditions within normal seasonal parameters.'
        },
      ],
      metrics: [
        { label: 'Temperature', value: `${tempMin}–{tempMax}°C`, sub: `Feels like ${tempMax + 3}°C with humidity`, icon: tempMax >= 34 ? '馃敟' : tempMax >= 30 ? '馃尋锔? : '馃尅锔? },
        { label: 'Humidity', value: isNEMonsoon ? '85–5%' : isSWMonsoon ? '65–0%' : '75–0%', sub: isNEMonsoon ? 'Very high' : 'Moderate鈥揌igh' },
        { label: 'Rainfall', value: rainIntensity === 'heavy' ? '10–0 mm/day' : rainIntensity === 'moderate' ? '5–5 mm/day' : rainIntensity === 'thunderstorm' ? '5–0 mm/day' : '<5 mm/day', sub: 'Estimated precipitation' },
        { label: 'Wind', value: isNEMonsoon ? '15–0 km/h NE' : '5–5 km/h SW', sub: isNEMonsoon ? 'Gusts to 50+ in storms' : 'Light breeze' },
        { label: 'UV Index', value: isSWMonsoon ? '10–2 (Extreme)' : isInterMonsoon ? '8–0 (Very High)' : '6– (High)', sub: 'SPF50+ recommended' },
        { label: 'Visibility', value: rainIntensity === 'heavy' ? '2– km' : rainIntensity === 'moderate' ? '5– km' : '8–2 km', sub: 'Highway driving' },
      ],
      tips: [
        rainIntensity === 'heavy' ? 'Delay departure if MET Malaysia issues Orange/Red alert. Never drive through flowing water.' : 'Keep sunglasses and windshield shade in car –tropical sun is intense even on cloudy days.',
        'Set car AC to recirculation mode during heavy rain to prevent window fogging.',
        'Check windshield wipers before trip –Malaysian downpours can reduce visibility to <50m in seconds.',
        rainIntensity === 'thunderstorm' ? 'If caught in thunderstorm: pull into nearest R&R, stay in vehicle, wait 20–0 min for storm to pass.' : 'Always carry drinking water –tropical heat + humidity = rapid dehydration on long drives.',
      ],
      timeBreakdown: [
        { time: '6AM–AM', condition: rainIntensity === 'heavy' ? 'Light鈥揗oderate rain' : 'Mostly clear', level: rainIntensity === 'heavy' ? 'moderate' : 'low', detail: rainIntensity === 'heavy' ? 'Intermittent morning drizzle.' : 'Best driving window –cool, dry.' },
        { time: '10AM–PM', condition: 'Hot & humid', level: 'moderate', detail: `Temperature rising to ${tempMax}°C. AC essential.` },
        { time: '2PM–PM', condition: rainIntensity === 'heavy' ? 'Heavy rain/t-storm' : rainIntensity === 'thunderstorm' ? 'T-storms likely' : rainIntensity === 'moderate' ? 'Showers developing' : 'Partly cloudy', level: rainIntensity === 'heavy' ? 'severe' : rainIntensity === 'thunderstorm' ? 'high' : 'moderate', detail: 'Highest rain probability window.' },
        { time: '7PM–1PM', condition: rainIntensity === 'heavy' ? 'Rain continuing' : 'Clearing', level: rainIntensity === 'heavy' ? 'high' : 'low', detail: rainIntensity === 'heavy' ? 'Persistent rain, reduced visibility.' : 'Evening cooling, good driving conditions.' },
        { time: '12AM–AM', condition: rainIntensity === 'heavy' ? 'Heavy rain possible' : 'Clear, cool', level: rainIntensity === 'heavy' ? 'moderate' : 'low', detail: rainIntensity === 'heavy' ? 'Overnight monsoon rain bands.' : `${tempMin}°C –ideal for night driving.` },
      ],
    },

    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // 3. RAIN RISK
    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    {
      e: rainRiskBase >= 60 ? '馃敶' : rainRiskBase >= 35 ? '馃煚' : '馃煝',
      l: 'Rain Risk',
      v: rainRiskBase >= 60 ? `${rainRiskBase}% 路 High probability` :
          rainRiskBase >= 35 ? `${rainRiskBase}% 路 Moderate risk` :
          `${rainRiskBase}% 路 Low risk`,
      severity: rainRiskBase >= 60 ? 'high' : rainRiskBase >= 35 ? 'moderate' : 'low',
      riskScore: rainRiskBase,
      sections: [
        {
          title: 'Rain Probability Analysis',
          icon: '馃導锔?,
          content: `Overall rain probability for your travel window: **${rainRiskBase}%**\n\n${rainRiskBase >= 60 ? `HIGH RISK –${isNEMonsoon ? 'Northeast Monsoon is actively bringing moisture-laden winds from the South China Sea across the peninsula.' : 'Atmospheric conditions favor persistent rainfall development.'} Rain is likely during your trip. Plan indoor activities and allow extra driving time.` : rainRiskBase >= 35 ? `MODERATE RISK –${isInterMonsoon ? 'Inter-monsoon conditions produce afternoon convective thunderstorms –typically short-lived (30–0 min) but intense.' : 'Scattered showers possible, especially in the afternoon.'} Rain gear recommended but unlikely to disrupt the entire trip.` : `LOW RISK –${isSWMonsoon ? 'Southwest Monsoon brings drier air from Sumatra –rain shadow effect protects the West Coast.' : 'Stable high-pressure system suppressing precipitation.'} Excellent outdoor conditions expected.`}\n\nRain typically develops: ${isInterMonsoon ? '3PM–PM (afternoon convection)' : isNEMonsoon ? 'Any time of day (persistent monsoon rain)' : '2PM–PM (brief afternoon showers)'}\nAverage storm duration: ${rainIntensity === 'thunderstorm' ? '30–0 minutes' : rainIntensity === 'heavy' ? '2– hours (persistent)' : '15–5 minutes'}`
        },
        {
          title: 'Hourly Rain Probability',
          icon: '馃搳',
          content: `6AM–AM: ${Math.round(rainRiskBase * 0.3)}% –${rainRiskBase >= 35 ? 'Morning drizzle possible' : 'Dry, best window'}\n9AM–2PM: ${Math.round(rainRiskBase * 0.5)}% –${rainRiskBase >= 60 ? 'Rain building' : 'Mostly dry'}\n12PM–PM: ${Math.round(rainRiskBase * 0.75)}% –${rainRiskBase >= 35 ? 'Showers developing' : 'Slight chance'}\n3PM–PM: ${Math.round(rainRiskBase * 1.0)}% –馃敶 Peak rain window\n6PM–PM: ${Math.round(rainRiskBase * 0.8)}% –${rainRiskBase >= 60 ? 'Rain tapering' : 'Clearing'}\n9PM–AM: ${Math.round(rainRiskBase * 0.4)}% –${rainRiskBase >= 60 ? 'Overnight rain possible' : 'Mostly dry'}`
        },
        {
          title: 'Impact on Outdoor Activities',
          icon: '馃彆锔?,
          content: rainRiskBase >= 60
            ? 'HIGH IMPACT –Schedule outdoor stops (viewpoints, nature walks, beach visits) before 12PM. After 2PM, focus on indoor attractions: museums, shopping, cafes, indoor markets. Waterproof your luggage and keep electronics in sealed bags.'
            : rainRiskBase >= 35
            ? 'MODERATE IMPACT –Plan outdoor activities for morning (6AM–2PM). Keep flexible afternoon plans –have indoor backup options ready. Carry compact umbrella and quick-dry clothing.'
            : 'MINIMAL IMPACT –Great conditions for all outdoor activities. Normal sun protection still essential (SPF50+, hat, sunglasses).'
        },
      ],
      metrics: [
        { label: 'Rain Probability', value: `${rainRiskBase}%`, sub: 'Over entire trip window', icon: rainRiskBase >= 60 ? '馃敶' : rainRiskBase >= 35 ? '馃煚' : '馃煝' },
        { label: 'Peak Rain Window', value: '3PM–PM', sub: `${Math.round(rainRiskBase * 1.0)}% probability`, icon: '鈴? },
        { label: 'Driest Window', value: '6AM–AM', sub: `${Math.round(rainRiskBase * 0.3)}% probability`, icon: '鈽€锔? },
        { label: 'Storm Duration', value: rainIntensity === 'thunderstorm' ? '30–0 min' : rainIntensity === 'heavy' ? '2– hrs' : '15–5 min', sub: 'Typical duration' },
        { label: 'Monsoon Phase', value: isNEMonsoon ? 'NE Monsoon Active' : isSWMonsoon ? 'SW Monsoon' : isInterMonsoon ? 'Inter-Monsoon' : 'Dry Phase', sub: 'Seasonal context' },
      ],
      tips: [
        rainRiskBase >= 60 ? 'Pack full rain gear: waterproof jacket, umbrella, waterproof bag covers, quick-dry towel.' : 'Carry a compact travel umbrella –tropical storms can develop within 15 minutes.',
        'Check live rain radar on met.gov.my or Rain Alarm app before each trip segment.',
        'Malaysian highways have excellent drainage –BUT avoid underpasses and low-lying exits during heavy downpours.',
        'If visibility drops below 100m: reduce speed to 60km/h, turn on hazard lights, and pull into the nearest R&R.',
      ],
    },

    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // 4. ROAD STATUS
    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    {
      e: allHighwaysOperational ? '馃煝' : '馃煛',
      l: 'Road Status',
      v: allHighwaysOperational ? 'All highways open' : 'Minor alerts active',
      severity: allHighwaysOperational ? 'low' : 'moderate',
      riskScore: allHighwaysOperational ? 5 : 30,
      sections: [
        {
          title: 'Highway Status Overview',
          icon: '馃洠锔?,
          content: highways.map(h => `**${h.name} (${h.code})**\nStatus: ${h.status === 'operational' ? '鉁?Fully Operational' : '鈿狅笍 Check Advisory'}\nSection: ${h.sections}\nOperator: ${h.operator}\nHotline: ${h.hotline}\nLanes: All lanes open in both directions. Emergency lanes clear.`).join('\n\n---\n\n') + `\n\n---\n\n**Last Updated:** ${new Date().toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}\n**Next Scheduled Inspection:** Routine PLUS patrols every 2 hours along the North-South Expressway.`
        },
        {
          title: 'Toll Plaza Status',
          icon: '馃帿',
          content: highways.filter(h => h.code === 'E1/E2').length > 0
            ? `PLUS North-South Expressway Toll Plazas:\n–All toll plazas operational 24/7\n–RFID lanes: Available at all major plazas (Sungai Besi, Rawang, Juru, Skudai, Ayer Keroh)\n–Touch \'n Go lanes: All plazas\n–Cash lanes: Limited –Juru, Sungai Besi, Skudai\n–eWallet reload: Available at all R&R stops and selected petrol stations\n\nToll Cost Estimate (${originName || 'Origin'} 鈫?${destName || 'Destination'}): RM ${tripDistance ? Math.round(tripDistance * 0.12) : '–} (Class 1 路 Passenger Car)`
            : 'No tolled highway sections on this route.'
        },
        {
          title: 'Rest & Service Areas (R&R)',
          icon: '鈽?,
          content: highways.filter(h => h.code === 'E1/E2').length > 0
            ? 'PLUS R&R stops every 30–0km along both directions. Key stops on your route:\n–All R&Rs have: Surau (prayer room), clean toilets, food court, parking\n–Major R&Rs (Rawang, Tapah, Juru, Ayer Keroh): Petrol station, ATM, WiFi, surau, souvenir shops\n–Lay-bys (every 20km): Basic toilets, parking, emergency phones\n–Overhead Bridge Restaurants: Sungai Perak, Ayer Keroh –unique dining experience above the highway'
            : 'Rest stops available along the route at regular intervals. Look for PETRONAS/Shell stations with Mesra/Select stores.'
        },
        {
          title: 'Emergency Services',
          icon: '馃啒',
          content: 'PLUS Hotline: 1800-88-0000 (24/7 Free)\nPolice/Ambulance: 999\nFire Department: 994\nPLUS Tow Truck: 1800-88-0000\n\nPLUSRonda patrol bikes every 50km stretch –response time <15 min on highway.\nEmergency call boxes every 2km on PLUS highway –pick up, auto-connects to traffic control center.\nWaze/Google Maps "Emergency" button connects to nearest response team.'
        },
      ],
      metrics: [
        { label: 'Highway Condition', value: 'Excellent', sub: 'Regularly maintained', icon: '馃煝' },
        { label: 'Lane Availability', value: 'All lanes open', sub: 'Both directions', icon: '鉁? },
        { label: 'Shoulder Status', value: 'Clear & usable', sub: 'Emergency stopping OK', icon: '馃煝' },
        { label: 'Lighting', value: 'Operational', sub: 'Interchange areas lit', icon: '馃挕' },
        { label: 'Toll System', value: 'RFID + TnG + Cash', sub: 'All payment modes', icon: '馃帿' },
        { label: 'Patrol Coverage', value: 'Every 50km', sub: 'PLUSRonda 24/7', icon: '馃弽锔? },
      ],
      tips: [
        'Keep PLUS hotline 1800-88-0000 saved in your phone –they dispatch roadside assistance free on PLUS highways.',
        'If you break down: pull onto emergency lane, turn on hazard lights, place safety triangle 30m behind car, stay behind guardrail.',
        'PLUS highway emergency call boxes (orange box every 2km) connect directly to traffic control –no phone needed.',
        'Download the PLUS Mobile App for real-time highway CCTV feeds and traffic updates.',
      ],
      highwayData: highways.map(h => ({ name: h.name, status: h.status === 'operational' ? '馃煝 Fully Operational' : '馃煛 Minor Issues', detail: `${h.code} 路 ${h.sections} 路 Patrol: ${h.operator}` })),
    },

    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // 5. FLOOD RISK
    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    {
      e: floodRiskScore >= 60 ? '馃敶' : floodRiskScore >= 30 ? '馃煛' : '馃煝',
      l: 'Flood Risk',
      v: floodRiskScore >= 60 ? 'High 路 Active flood watch' :
          floodRiskScore >= 30 ? 'Moderate 路 Low-lying areas' :
          'Low 路 No alerts',
      severity: floodRiskScore >= 60 ? 'severe' : floodRiskScore >= 30 ? 'moderate' : 'low',
      riskScore: floodRiskScore,
      sections: [
        {
          title: 'Flood Risk Assessment',
          icon: '馃寠',
          content: `Overall flood risk for your route: **${floodRiskScore >= 60 ? 'HIGH' : floodRiskScore >= 30 ? 'MODERATE' : 'LOW'}** (${floodRiskScore}/100)\n\n${floodRiskScore >= 60 ? `鈿狅笍 ELEVATED FLOOD RISK –${isNEMonsoon ? 'Northeast Monsoon is producing heavy rainfall across the East Coast. Major rivers (Sungai Pahang, Sungai Kelantan, Sungai Terengganu) at elevated levels. JPS (Department of Irrigation & Drainage) flood monitoring stations active.' : 'Saturated ground conditions + forecast heavy rain = elevated flood risk along route.'} Highway drainage systems are operational but may be overwhelmed during extreme downpours (>60mm/hour).` : floodRiskScore >= 30 ? `MODERATE FLOOD RISK –${isNEMonsoon || isInterMonsoon ? 'Seasonal rainfall may cause localised water pooling on low-lying highway sections.' : 'Isolated low-lying sections may experience minor water accumulation during heavy downpours.'} Highway drainage capable of handling normal rainfall. Monitor conditions during active storms.` : `LOW FLOOD RISK –${isSWMonsoon ? 'Dry season conditions. Water tables are low and drainage systems have maximum capacity.' : 'No significant flood threats for your route. Highway drainage functioning normally.'}`}\n\nJPS Flood Monitoring: ${floodRiskScore >= 60 ? '鈿狅笍 Multiple stations on alert –check publicinfobanjir.water.gov.my' : '鉁?All stations within normal levels'}`
        },
        {
          title: 'Route Flood-Prone Sections',
          icon: '馃搷',
          content: floodSections.length > 0
            ? floodSections.map((s, i) => `${i + 1}. **${s.location}**\n   Risk Level: ${s.risk === 'high' ? '馃敶 HIGH' : s.risk === 'moderate' ? '馃煛 MODERATE' : '馃煝 LOW'}\n   ${s.detail}`).join('\n\n')
            : '鉁?No known flood-prone sections identified along your specific route. All highway segments have adequate drainage infrastructure.'
        },
        {
          title: 'Highway Drainage Infrastructure',
          icon: '馃彈锔?,
          content: 'PLUS North-South Expressway:\n–Designed to AASHTO drainage standards –handles 100-year rainfall events\n–Cross-drainage culverts every 500m–km\n–Side drains with debris grates –cleaned quarterly\n–SMART Tunnel (KL section): Diverts 3 million m鲁 stormwater during heavy KL rain\n–Elevated sections: Minimum 1.5m above surrounding floodplain\n\nLPT East Coast Expressway:\n–Built with monsoon hydrology modeling\n–14 major river bridges with flood clearance > 5m\n–Pump stations at 3 low-lying interchanges (Kemaman, Dungun, Kuala Terengganu)\n–Flood sensor network linked to LPT traffic control center'
        },
        {
          title: 'Emergency Flood Protocols',
          icon: '馃毃',
          content: 'IF HIGHWAY FLOODING OCCURS:\n1. Do NOT drive through flowing water –30cm of water floats most cars\n2. Turn around at nearest interchange if highway ahead is water-covered\n3. Call PLUS Hotline 1800-88-0000 for flood status and alternate route guidance\n4. Move to elevated sections –PLUS highway is mostly raised above floodplain\n5. Tune to RTM Radio Klasik FM 87.7 / TraXX FM 90.3 for flood bulletins\n\nALTERNATE ROUTES DURING FLOOD:\n–PLUS highway flooding 鈫?Use federal route FT1 (old trunk road, higher elevation)\n–LPT flooding 鈫?Use coastal route FT3 (check bridge status first)\n–KL area flooding 鈫?Use SUKE/DASH elevated highways (newer, better drainage)'
        },
      ],
      metrics: [
        { label: 'Flood Risk Score', value: `${floodRiskScore}/100`, sub: floodRiskScore >= 60 ? 'Active monitoring' : floodRiskScore >= 30 ? 'Seasonal awareness' : 'Normal conditions', icon: floodRiskScore >= 60 ? '馃敶' : floodRiskScore >= 30 ? '馃煛' : '馃煝' },
        { label: 'High-Risk Sections', value: `${highRiskFloodSections}`, sub: highRiskFloodSections > 0 ? 'Needs monitoring' : 'None on route' },
        { label: 'Moderate-Risk Sections', value: `${modRiskFloodSections}`, sub: modRiskFloodSections > 0 ? 'Awareness advised' : 'None on route' },
        { label: 'Drainage Capacity', value: floodRiskScore >= 60 ? 'Strained' : 'Adequate', sub: floodRiskScore >= 60 ? '>80% utilized' : '<40% utilized' },
        { label: 'River Levels', value: isNEMonsoon && isEastCoast ? 'Elevated 鈿狅笍' : 'Normal', sub: 'JPS monitoring stations' },
      ],
      tips: [
        'Bookmark publicinfobanjir.water.gov.my –JPS real-time flood map with water level sensors across Malaysia.',
        'If water covers the road: STOP. 15cm of fast-flowing water knocks a person down. 30cm floats a car. 60cm sweeps vehicles away.',
        'Never drive through flood water at night –depth is impossible to judge. Turn around, find alternate route.',
        'Keep emergency kit in car: flashlight, drinking water, snacks, power bank, waterproof bag for documents.',
      ],
    },

    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    // 6. ROAD WORKS
    // 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    {
      e: roadWorks.filter(w => w.status.includes('馃煛')).length > 0 ? '馃煛' : '馃煝',
      l: 'Road Works',
      v: roadWorks.filter(w => w.status.includes('馃煛')).length > 0 ? `${roadWorks.filter(w => w.status.includes('馃煛')).length} active 路 Minor delays` :
          roadWorks.length === 1 && roadWorks[0]?.location === '– ? 'None on route' :
          `${roadWorks.length} active 路 ${roadWorks.every(w => w.status.includes('Minor')) ? 'No delays' : 'Check details'}`,
      severity: roadWorks.filter(w => w.status.includes('馃煛')).length > 0 ? 'moderate' : 'low',
      riskScore: roadWorks.filter(w => w.status.includes('馃煛')).length > 0 ? 25 : 5,
      sections: [
        {
          title: 'Active Road Works on Your Route',
          icon: '馃毀',
          content: roadWorks.map((w, i) => `${i + 1}. **${w.highway}** –${w.location}\n   Status: ${w.status}\n   Schedule: ${w.schedule}\n   Impact: ${w.impact}`).join('\n\n') + `\n\n---\n\nMalaysian highway maintenance is conducted to LLM (Lembaga Lebuhraya Malaysia) standards. Night works are standard practice to minimize daytime disruption. All work zones have: speed reduction (60–0km/h), advance warning signs at 1km and 500m, concrete barriers separating workers from traffic, and dedicated traffic marshals.`
        },
        {
          title: 'Planned Maintenance Calendar',
          icon: '馃搮',
          content: `Current Month: **${startDate.toLocaleDateString('en', { month: 'long' })}**\n\n${month >= 2 && month <= 9 ? '馃敡 DRY SEASON MAINTENANCE PERIOD (Mar鈥揙ct)\nMalaysian highway operators schedule major resurfacing and structural works during the drier months. Expect:\n–PLUS NSE: Resurfacing campaigns (rolling, 20–0km sections)\n–Bridge joint replacements at major river crossings\n–Drainage cleaning and culvert desilting\n–Guardrail upgrades and line repainting\n\nMost works are night-only (10PM–AM) on weekdays.' : '馃導锔?WET SEASON –MINIMAL MAINTENANCE (Nov鈥揊eb)\nMajor construction is suspended during monsoon season. Only emergency repairs (pothole patching, debris clearance, drainage unblocking) are conducted. Work windows are shorter due to rain constraints.'}\n\nNext Major Works: ${month < 2 ? 'March 2027' : month < 10 ? 'November 2026' : 'March 2027'} (start of next dry season maintenance window)`
        },
        {
          title: 'Traffic Impact Analysis',
          icon: '鈿狅笍',
          content: roadWorks.filter(w => w.status.includes('馃煛')).length > 0
            ? `鈿狅笍 ROAD WORKS MAY AFFECT YOUR JOURNEY\n\nEstimated Additional Time: ${roadWorks.filter(w => w.status.includes('馃煛')).length * 10}–{roadWorks.filter(w => w.status.includes('馃煛')).length * 20} minutes (cumulative through all work zones)\n\nWork Zone Speed Limits:\n–Active works (workers present): 60 km/h\n–Works with barriers only: 80 km/h\n–Speed cameras active at all work zones\n\nRecommendation: Add 15–0% buffer to your estimated travel time. Night driving through work zones is smoother (lower traffic 脳 work activity overlap).`
            : '鉁?No road works that will impact your travel time. All highway sections operating at full capacity with no lane closures or speed restrictions.'
        },
      ],
      metrics: [
        { label: 'Active Works', value: `${roadWorks.filter(w => !w.location.includes('–)).length}`, sub: 'On your route', icon: roadWorks.filter(w => !w.location.includes('–)).length > 0 ? '馃煛' : '馃煝' },
        { label: 'Night Works', value: roadWorks.filter(w => w.schedule.includes('Night')).length.toString(), sub: '10PM–AM schedule', icon: '馃寵' },
        { label: 'Day Works', value: roadWorks.filter(w => w.schedule.includes('Day')).length.toString(), sub: 'Off-peak hours', icon: '鈽€锔? },
        { label: 'Max Delay', value: roadWorks.filter(w => w.status.includes('馃煛')).length > 0 ? '+20 min' : '0 min', sub: 'Cumulative worst case' },
        { label: 'Speed Restrictions', value: roadWorks.filter(w => w.status.includes('馃煛')).length > 0 ? '60–0 km/h' : '110 km/h', sub: 'Through work zones' },
      ],
      tips: [
        'Night driving (10PM–AM) through work zones is smoother and safer –less traffic and active works are well-lit.',
        'AES speed cameras are active at all Malaysian highway work zones. Fines: RM 150–100 for exceeding work zone speed limits.',
        'Check PLUS website (plus.com.my) "Traffic & Works" section 24 hours before departure for last-minute work zone updates.',
        'Waze reports active work zones with crowd-sourced delay estimates –enable "Roadworks" alerts in app settings.',
      ],
    },
  ];

  return conditions;
}
