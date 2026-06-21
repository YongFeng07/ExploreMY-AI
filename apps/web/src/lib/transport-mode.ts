/** Intelligent transport mode detection for Malaysian destinations */
export function getTransportMode(origin: string, dest: string) {
  const d = dest.toLowerCase();
  const o = origin.toLowerCase();

  const eastMY = ['sabah','sarawak','kota kinabalu','kuching','miri','sandakan','tawau','semporna','sibu','bintulu','lahad datu'];
  const westMY = ['kuala lumpur','selangor','penang','johor','melaka','perak','kedah','kelantan','terengganu','pahang','negeri sembilan','putrajaya','kl'];
  const ferryIslands = ['langkawi','perhentian','redang','tioman','pangkor','rawa','kapas'];

  if (eastMY.some(x => d.includes(x)) && westMY.some(x => o.includes(x))) {
    return { mode: 'FLIGHT' as const, icon: '✈️', label: 'Flight Required', detail: `${dest} is in East Malaysia. You need to fly from KL or your nearest airport. Driving across the South China Sea is impossible.`, estimate: '~2.5h flight · RM 200-600/person' };
  }
  if (ferryIslands.some(x => d.includes(x))) {
    return { mode: 'FERRY' as const, icon: '🚢', label: 'Ferry/Boat Required', detail: `${dest} is an island. Drive to the nearest jetty, then take a ferry or speedboat.`, estimate: 'Drive to jetty + ferry · RM 30-150/person' };
  }
  if (d.includes('penang') || d.includes('george town')) {
    return { mode: 'DRIVE' as const, icon: '🌉', label: 'Drive via Bridge', detail: 'Penang is connected by the Penang Bridge and Second Link. No ferry needed.', estimate: 'Drive via Penang Bridge or E36' };
  }
  return { mode: 'DRIVE' as const, icon: '🚗', label: 'Road Trip', detail: 'Direct road trip via Malaysian highways.', estimate: 'PLUS Highway or federal routes' };
}
