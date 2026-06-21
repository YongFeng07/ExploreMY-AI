import { Injectable, Logger } from '@nestjs/common';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCyohvWiwbAd2UbDpOW-9Os0_eIo8JQ_D8';

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  city: string;
  country: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private cache = new Map<string, GeocodingResult>();

  /**
   * Resolve any worldwide destination name to coordinates via Google Geocoding API.
   */
  async geocode(destination: string): Promise<GeocodingResult | null> {
    const key = destination.toLowerCase().trim();
    if (this.cache.has(key)) return this.cache.get(key)!;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${GOOGLE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.results?.[0]) {
        this.logger.warn(`Geocoding failed for: ${destination}`);
        return null;
      }

      const result = data.results[0];
      const location = result.geometry.location;
      const components = result.address_components || [];

      const getComponent = (type: string) =>
        components.find((c: any) => c.types.includes(type))?.long_name;

      const geocoded: GeocodingResult = {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        city: getComponent('locality') || getComponent('administrative_area_level_2') || destination,
        country: getComponent('country') || '',
      };

      this.cache.set(key, geocoded);
      this.logger.log(`Geocoded "${destination}" → ${geocoded.city}, ${geocoded.country} (${geocoded.lat}, ${geocoded.lng})`);
      return geocoded;
    } catch (err) {
      this.logger.warn(`Geocoding error for "${destination}": ${err}`);
      return null;
    }
  }
}
