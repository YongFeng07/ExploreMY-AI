const API = '/api/v1';
export const tripsService = {
  async getUserTrips(userId: string) { const res = await fetch(`${API}/trips/user/${userId}`); return res.json(); },
  async create(trip: any) { const res = await fetch(`${API}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trip) }); return res.json(); },
};
