// LocalStorage Keys
const PHARMACY_KEY = "pharmacy_list";
const ADDRESS_KEY = "saved_addresses";

// ------------------------------------
// Pharmacy JSON API (LOCALSTORAGE)
// ------------------------------------
export const loadPharmacies = () => {
  try {
    const raw = localStorage.getItem(PHARMACY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const savePharmacies = (list) => {
  localStorage.setItem(PHARMACY_KEY, JSON.stringify(list));
};

// ------------------------------------
// Address JSON API
// ------------------------------------
export const loadAddresses = () => {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAddresses = (list) => {
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(list));
};

// ------------------------------------
// Calculate Distance (Haversine)
// ------------------------------------
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ------------------------------------
// Get Nearest Pharmacy
// ------------------------------------
export const getNearestPharmacy = (lat, lng) => {
  const list = loadPharmacies();
  if (!list.length) return null;

  let nearest = list[0];
  let bestDist = distanceKm(lat, lng, list[0].lat, list[0].lng);

  for (let p of list) {
    const d = distanceKm(lat, lng, p.lat, p.lng);
    if (d < bestDist) {
      bestDist = d;
      nearest = p;
    }
  }

  return { pharmacy: nearest, distanceKm: bestDist };
};
