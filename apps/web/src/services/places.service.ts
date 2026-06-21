const API = 'http://localhost:3001/api/v1';
export const placesService = {
  async nearby(lat: number, lng: number, radius = 5000, category?: string) {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
    if (category) params.set('category', category);
    const res = await fetch(`${API}/places/nearby?${params}`);
    return res.json();
  },
  async search(query: string, lat?: number, lng?: number) {
    const params = new URLSearchParams({ q: query });
    if (lat) params.set('lat', String(lat));
    if (lng) params.set('lng', String(lng));
    const res = await fetch(`${API}/places/search?${params}`);
    return res.json();
  },
  async details(placeId: string) {
    const res = await fetch(`${API}/places/details/${placeId}`);
    return res.json();
  },
  async bySlug(slug: string) {
    const res = await fetch(`${API}/places/${slug}`);
    return res.json();
  },
};
