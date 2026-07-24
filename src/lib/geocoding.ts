// Canadian city centroids used as a geocoding fallback when no MAPBOX_TOKEN
// is configured, so the app works out of the box without a paid API key.
// Swap in a real geocoder by setting MAPBOX_TOKEN — this stays a single seam.
const CITY_CENTROIDS: Record<string, { latitude: number; longitude: number }> = {
  toronto: { latitude: 43.6532, longitude: -79.3832 },
  mississauga: { latitude: 43.589, longitude: -79.6441 },
  brampton: { latitude: 43.7315, longitude: -79.7624 },
  hamilton: { latitude: 43.2557, longitude: -79.8711 },
  ottawa: { latitude: 45.4215, longitude: -75.6972 },
  london: { latitude: 42.9849, longitude: -81.2453 },
  kitchener: { latitude: 43.4516, longitude: -80.4925 },
  windsor: { latitude: 42.3149, longitude: -83.0364 },
  vaughan: { latitude: 43.8361, longitude: -79.4985 },
  markham: { latitude: 43.8561, longitude: -79.337 },
  oshawa: { latitude: 43.8971, longitude: -78.8658 },
  barrie: { latitude: 44.3894, longitude: -79.6903 },
  vancouver: { latitude: 49.2827, longitude: -123.1207 },
  surrey: { latitude: 49.1913, longitude: -122.849 },
  calgary: { latitude: 51.0447, longitude: -114.0719 },
  edmonton: { latitude: 53.5461, longitude: -113.4938 },
  winnipeg: { latitude: 49.8951, longitude: -97.1384 },
  montreal: { latitude: 45.5019, longitude: -73.5674 },
  quebec_city: { latitude: 46.8139, longitude: -71.208 },
  halifax: { latitude: 44.6488, longitude: -63.5752 },
};

const DEFAULT_CENTROID = CITY_CENTROIDS.toronto;

export async function geocode(city: string, region: string, postalCode: string) {
  if (process.env.MAPBOX_TOKEN) {
    const query = encodeURIComponent(`${city}, ${region}, ${postalCode}, Canada`);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=ca&limit=1&access_token=${process.env.MAPBOX_TOKEN}`
    );
    if (res.ok) {
      const data = await res.json();
      const coords = data?.features?.[0]?.center;
      if (coords) return { latitude: coords[1], longitude: coords[0] };
    }
  }

  const key = city.trim().toLowerCase().replace(/\s+/g, "_");
  return CITY_CENTROIDS[key] ?? DEFAULT_CENTROID;
}

export function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
