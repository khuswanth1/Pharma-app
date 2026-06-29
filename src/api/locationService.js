// src/api/locationService.js
import apiClient from './apiClient';

export const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse?format=jsonv2";
export const OVERPASS_API = "https://overpass-api.de/api/interpreter";

export async function backendGeocodeSearch(text) {
  try {
    const response = await apiClient.get('/api/auth/geocode/search', { params: { text } });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Geocode search failed.';
  }
}

export async function backendReverseGeocode(lat, lng) {
  try {
    const response = await apiClient.get('/api/auth/geocode/reverse', { params: { lat, lng } });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Reverse geocoding failed.';
  }
}

/**
 * Reverse geocode latitude/longitude -> address object using OSM Nominatim
 * returns: {area, road, city, state, postcode, country, display_name, raw}
 */
export async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM_REVERSE}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&accept-language=en`;
  const res = await fetch(url, { headers: { "User-Agent": "Anand-Pharmacy-App/1.0" } });
  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = await res.json();
  const a = data.address || {};
  return {
    area: a.suburb || a.neighbourhood || a.village || a.town || a.city || "",
    road: a.road || "",
    city: a.city || a.town || a.village || a.county || "",
    district: a.county || "",
    state: a.state || "",
    pincode: a.postcode || "",
    country: a.country || "",
    display_name: data.display_name || "",
    raw: data,
  };
}

/**
 * Fetch nearby pharmacies (nodes + ways) within radius (meters) using Overpass
 * Returns array of {id, name, lat, lon, tags}
 */
export async function fetchNearbyPharmacies(lat, lon, radius = 2000) {
  // Overpass QL: search nodes/ways with amenity=pharmacy around <radius>
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="pharmacy"](around:${radius},${lat},${lon});
      way["amenity"="pharmacy"](around:${radius},${lat},${lon});
      relation["amenity"="pharmacy"](around:${radius},${lat},${lon});
    );
    out center 20;
  `;
  const res = await fetch(OVERPASS_API, {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
  });
  if (!res.ok) throw new Error("Overpass API failed");
  const data = await res.json();
  const items = (data.elements || []).map((el) => {
    const coords = el.type === "node" ? { lat: el.lat, lon: el.lon } : (el.center || {});
    return {
      id: el.id,
      name: (el.tags && (el.tags.name || el.tags["brand"])) || "Unnamed Pharmacy",
      lat: coords.lat,
      lon: coords.lon,
      tags: el.tags || {},
    };
  }).filter(it => it.lat && it.lon);
  return items;
}

/** Haversine distance (meters) */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
