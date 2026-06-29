import {
  getAddressesAPI,
  addAddressAPI,
  updateAddressAPI,
  deleteAddressAPI,
  setPrimaryAddressAPI
} from "../api/addressService";

const STORAGE_KEY = "pharma_addresses";

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("pharmacy_user") || localStorage.getItem("user"));
    return user ? (user.id || user.userId) : null;
  } catch (e) {
    return null;
  }
};

/* -------------------- LOAD -------------------- */
export function loadAddresses() {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    list = [];
  }
  
  let healed = false;
  list = list.map((a, idx) => {
    if (a.id === null || a.id === undefined) {
      healed = true;
      return { ...a, id: Date.now() + idx + Math.floor(Math.random() * 1000) };
    }
    return a;
  });
  
  if (healed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  
  return list;
}

/* -------------------- SAVE -------------------- */
export function saveAddresses(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}

/* -------------------- SYNC WITH BACKEND -------------------- */
export async function syncAddressesWithBackend(userId) {
  if (!userId) return;
  try {
    const response = await getAddressesAPI(userId);
    if (response && response.success) {
      saveAddresses(response.data);
    }
  } catch (e) {
    console.error("Error syncing addresses from backend:", e);
  }
}

/* -------------------- ADD -------------------- */
export async function addAddressLocal(addr) {
  const userId = getUserId();
  if (userId) {
    try {
      const payload = { ...addr, userId, id: null };
      const response = await addAddressAPI(payload);
      if (response && response.success) {
        addr = response.data;
      }
    } catch (e) {
      console.error("Failed to add address on backend:", e);
    }
  }

  const list = loadAddresses();
  list.unshift(addr);
  saveAddresses(list);
}

/* -------------------- UPDATE -------------------- */
export async function updateAddressLocal(id, data) {
  const userId = getUserId();
  if (userId && typeof id === "number" && id > 1000000000000) {
    // Temporary frontend ID, handle locally or fallback
  } else if (userId) {
    try {
      const payload = { ...data, userId };
      const response = await updateAddressAPI(id, payload);
      if (response && response.success) {
        data = response.data;
      }
    } catch (e) {
      console.error("Failed to update address on backend:", e);
    }
  }

  const list = loadAddresses().map((a) =>
    a.id === id ? { ...a, ...data } : a
  );
  saveAddresses(list);
}

/* -------------------- DELETE -------------------- */
export async function removeAddress(id) {
  const userId = getUserId();
  if (userId && !(typeof id === "number" && id > 1000000000000)) {
    try {
      await deleteAddressAPI(id);
    } catch (e) {
      console.error("Failed to delete address on backend:", e);
    }
  }

  const oldList = loadAddresses();
  const wasPrimary = oldList.find((a) => String(a.id) === String(id))?.primary;
  
  const list = oldList.filter((a) => String(a.id) !== String(id));
  
  if (wasPrimary && list.length > 0) {
    list[0].primary = true;
    if (userId && !(typeof list[0].id === "number" && list[0].id > 1000000000000)) {
      try {
        await setPrimaryAddressAPI(list[0].id, userId);
      } catch (e) {
        console.error("Failed to sync new primary address on backend:", e);
      }
    }
  }
  
  saveAddresses(list);
}

/* -------------------- SET PRIMARY -------------------- */
export async function setPrimaryAddress(id) {
  const userId = getUserId();
  if (userId && !(typeof id === "number" && id > 1000000000000)) {
    try {
      await setPrimaryAddressAPI(id, userId);
    } catch (e) {
      console.error("Failed to set primary address on backend:", e);
    }
  }

  let list = loadAddresses();
  list = list.map((a) => ({
    ...a,
    primary: String(a.id) === String(id),
  }));

  saveAddresses(list);
}

/* -------------------- GET PRIMARY -------------------- */
export function getPrimaryAddress() {
  const list = loadAddresses();
  const primary = list.find((a) => a.primary);
  if (primary) return primary;
  return list[0] || null;
}

/* ============================================================
   TEMP STORAGE FOR LAST MAP LOCATION
   ============================================================ */
const MAP_KEY = "pharma_last_map_location";

export function saveLastMapLocation(loc) {
  localStorage.setItem(MAP_KEY, JSON.stringify(loc));
}

export function loadLastMapLocation() {
  return JSON.parse(localStorage.getItem(MAP_KEY)) || null;
}

/* ============================================================
   🎤 VOICE INSTRUCTION TEMP STORAGE
   ============================================================ */
const VOICE_KEY = "pharma_voice_instructions";

export function saveVoiceInstruction(text) {
  localStorage.setItem(VOICE_KEY, text);
  window.dispatchEvent(new Event("storage"));
}

export function loadVoiceInstruction() {
  return localStorage.getItem(VOICE_KEY) || "";
}

export function clearVoiceInstruction() {
  localStorage.removeItem(VOICE_KEY);
}
