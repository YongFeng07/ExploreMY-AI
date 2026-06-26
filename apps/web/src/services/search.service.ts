const API = '/api/v1';
export const searchService = {
  async search(query: string, lat?: number, lng?: number) {
    const params = new URLSearchParams({ q: query });
    if (lat) params.set('lat', String(lat));
    if (lng) params.set('lng', String(lng));
    const res = await fetch(`${API}/search?${params}`);
    return res.json();
  },
  async autocomplete(query: string) {
    const res = await fetch(`${API}/search/autocomplete?q=${encodeURIComponent(query)}`);
    return res.json();
  },
};
