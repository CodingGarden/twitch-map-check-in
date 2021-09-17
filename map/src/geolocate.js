const locationCache = new Map();

export default async function geolocate(location) {
  const query = encodeURIComponent(location.toLowerCase().trim());
  if (locationCache.has(query)) {
    return locationCache.get(query);
  }
  const promise = (async () => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/?&q=${query}&format=json&limit=1`);
      if (response.ok) {
        const results = await response.json();
        const [result] = results;
        if (!result) return null;
        return {
          lat: result.lat,
          long: result.lon,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  })();
  locationCache.set(query, promise);
  return promise;
}