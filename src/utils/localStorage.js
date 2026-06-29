const KEY = "pharmacy_selected_location";

// Load saved location
export const loadSelectedLocation = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

// Save selected location
export const saveSelectedLocation = (loc) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch (err) {
    console.error("Failed to save location", err);
  }
};
