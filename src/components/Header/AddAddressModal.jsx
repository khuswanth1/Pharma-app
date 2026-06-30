// src/components/Header/AddAddressModal.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Close,
  Mic,
  PhoneEnabled,
  Home,
  Work,
  LocationOn,
  Person,
  Phone,
  Apartment,
  MapsHomeWork,
  NearMe,
  SaveAlt,
  ArrowBack,
  MyLocation,
} from "@mui/icons-material";
import VoiceInput from "./VoiceInput";
import { addAddressLocal, updateAddressLocal } from "../../utils/addressStorage";
import { backendReverseGeocode } from "../../api/locationService";

export default function AddAddressModal({
  initialCoords,
  editingAddress,
  locationPayload,
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState({
    id: null,
    typeTag: "Home",
    flat: "",
    building: "",
    landmark: "",
    fullText: "",
    receiverName: "",
    phone: "",
    lat: null,
    lng: null,
  });

  /* ----------------------- RECORDING STATE ----------------------- */
  const [recording, setRecording] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillStatus, setAutofillStatus] = useState("");
  const hasGeocodedRef = useRef(false);

  /* ----------------------- RECORD VOICE ----------------------- */
  const recordInstructions = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";

    rec.onstart = () => setRecording(true);
    rec.onend = () => setRecording(false);

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;

      // Append or replace address
      setForm((p) => ({
        ...p,
        fullText: p.fullText
          ? p.fullText + " " + text
          : text,
      }));
    };

    rec.start();
  };

  /* ----------------------- HELPLINE ----------------------- */
  const callHelpline = () => {
    window.location.href = "tel:+911234567890";
  };

  /* ----------------------- SMART GEOCODING HELPER ----------------------- */
  const geocodeLatLng = useCallback(async (lat, lng) => {
    if (window.google && window.google.maps && import.meta.env.VITE_GOOGLE_MAPS_KEY && import.meta.env.VITE_GOOGLE_MAPS_KEY !== "undefined") {
      const geocoder = new window.google.maps.Geocoder();
      try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        const results = response?.results || response;
        if (results && results[0]) {
          const fullAddress = results[0].formatted_address;
          const comps = results[0].address_components || [];
          const get = (...types) => {
            const found = comps.find((c) => types.some((t) => c.types.includes(t)));
            return found ? found.long_name : "";
          };

          const c = {
            premise: get("premise"),
            building: get("subpremise", "establishment"),
            streetNumber: get("street_number"),
            route: get("route"),
            landmark: get("point_of_interest", "natural_feature", "park"),
            sublocality: get("sublocality_level_1", "sublocality_level_2", "sublocality"),
            locality: get("locality"),
            city: get("administrative_area_level_2"),
            state: get("administrative_area_level_1"),
            country: get("country"),
            pincode: get("postal_code"),
          };

          const autoFlat = [c.premise, c.streetNumber].filter(Boolean).join(", ");
          const autoBuilding = [c.building, c.route].filter(Boolean).join(", ");
          const autoLandmark = [c.landmark, c.sublocality].filter(Boolean).join(", ");

          return {
            fullText: fullAddress,
            flat: autoFlat,
            building: autoBuilding,
            landmark: autoLandmark,
          };
        }
      } catch (err) {
        console.error("Google Geocoding failed:", err);
      }
    }
    // Fallback 1: Backend Geoapify Reverse Geocoding API
    try {
      const res = await backendReverseGeocode(lat, lng);
      if (res && res.success && res.data && res.data.features && res.data.features[0]) {
        const props = res.data.features[0].properties;
        const autoFlat = props.house_number || "";
        const autoBuilding = [props.street, props.suburb].filter(Boolean).join(", ");
        const autoLandmark = [props.district, props.sublocality].filter(Boolean).join(", ");
        return {
          fullText: props.formatted || "",
          flat: autoFlat,
          building: autoBuilding,
          landmark: autoLandmark,
        };
      }
    } catch (err) {
      console.error("Backend Geoapify Reverse Geocode failed:", err);
    }

    // Fallback 2: OpenStreetMap Nominatim API
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const autoFlat = addr.house_number || "";
        const autoBuilding = [addr.road, addr.suburb].filter(Boolean).join(", ");
        const autoLandmark = [addr.neighbourhood, addr.amenity, addr.tourism].filter(Boolean).join(", ");

        return {
          fullText: data.display_name,
          flat: autoFlat,
          building: autoBuilding,
          landmark: autoLandmark,
        };
      }
    } catch (err) {
      console.error("OSM Fallback Geocoding failed:", err);
    }

    return null;
  }, []);

  const reverseGeocodeCoords = useCallback(async (lat, lng) => {
    try {
      const data = await geocodeLatLng(lat, lng);
      if (data) {
        setForm((p) => ({
          ...p,
          lat,
          lng,
          fullText: data.fullText || p.fullText,
          flat: data.flat || p.flat,
          building: data.building || p.building,
          landmark: data.landmark || p.landmark,
        }));
      }
    } catch (err) {
      console.error("Auto geocoding initialCoords failed:", err);
    }
  }, [geocodeLatLng]);

  const detectAndAutofill = () => {
    if (autofillLoading) return;
    setAutofillLoading(true);
    setAutofillStatus("Detecting GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setAutofillStatus("Fetching Address...");

        try {
          const data = await geocodeLatLng(lat, lng);
          if (data) {
            setForm((p) => ({
              ...p,
              lat,
              lng,
              fullText: data.fullText || p.fullText,
              flat: data.flat || p.flat,
              building: data.building || p.building,
              landmark: data.landmark || p.landmark,
            }));
            setAutofillStatus("Filled Successfully!");
          } else {
            setAutofillStatus("Not Found");
          }
        } catch (err) {
          console.error("Autofill error:", err);
          setAutofillStatus("Failed");
        } finally {
          setTimeout(() => {
            setAutofillLoading(false);
            setAutofillStatus("");
          }, 1500);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setAutofillStatus("GPS Denied");
        setTimeout(() => {
          setAutofillLoading(false);
          setAutofillStatus("");
        }, 1500);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ----------------------- AUTO-FILL HELPER ----------------------- */
  const applyLocationData = useCallback((temp) => {
    if (!temp) return;
    const c = temp.components || {};

    // Build smart auto-fill values from geocoder components
    const autoFlat = [c.premise, c.streetNumber].filter(Boolean).join(", ");
    const autoBuilding = [c.building, c.route].filter(Boolean).join(", ");
    const autoLandmark = [c.landmark, c.sublocality].filter(Boolean).join(", ");

    setForm((p) => ({
      ...p,
      lat: temp.lat,
      lng: temp.lng,
      fullText: temp.address || p.fullText,
      flat: autoFlat || p.flat,
      building: autoBuilding || p.building,
      landmark: autoLandmark || p.landmark,
    }));
  }, []);

  /* ----------------------- LOAD DATA ----------------------- */
  useEffect(() => {
    if (editingAddress) {
      setForm(editingAddress);
      return;
    }

    // Priority 1: Direct prop from LocationMapModal
    if (locationPayload) {
      applyLocationData(locationPayload);
      return;
    }

    // Priority 2: Global temp variable (fallback bridge)
    const temp = window.__PHARMA_TEMP_SELECTED_LOCATION;
    if (temp) {
      applyLocationData(temp);
      delete window.__PHARMA_TEMP_SELECTED_LOCATION;
      return;
    }

    if (initialCoords) {
      setForm((p) => ({
        ...p,
        lat: initialCoords.lat,
        lng: initialCoords.lng,
      }));

      if (!hasGeocodedRef.current) {
        hasGeocodedRef.current = true;
        reverseGeocodeCoords(initialCoords.lat, initialCoords.lng);
      }
    }
  }, [initialCoords, editingAddress, locationPayload, applyLocationData, reverseGeocodeCoords]);

  const update = (key, v) => setForm((p) => ({ ...p, [key]: v }));

  const handleSave = async () => {
    const payload = {
      ...form,
      id: form.id || Date.now(),
    };

    if (form.id) {
      await updateAddressLocal(payload.id, payload);
    } else {
      await addAddressLocal(payload);
    }

    onSaved && onSaved();
  };

  /* ----------------------- TYPE TAG CONFIG ----------------------- */
  const typeTags = [
    { label: "Home", icon: <Home sx={{ fontSize: 16 }} /> },
    { label: "Work", icon: <Work sx={{ fontSize: 16 }} /> },
    { label: "Other", icon: <LocationOn sx={{ fontSize: 16 }} /> },
  ];

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* POPUP CARD */}
      <div
        className="
          relative bg-white w-full h-full md:h-auto md:w-full md:max-w-xl md:rounded-[24px]
          md:shadow-2xl overflow-hidden flex flex-col
          animate-in zoom-in-95 duration-200 border border-slate-100
          md:max-h-[92vh]
        "
      >
        {/* ============ HEADER ============ */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95"
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">
                {form.id ? "Edit Address" : "Add Address"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                FILL IN YOUR DELIVERY ADDRESS DETAILS
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95"
          >
            <Close sx={{ fontSize: 20 }} />
          </button>
        </div>

        {/* ============ BODY ============ */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 no-scrollbar">

          {/* LOCATION PREVIEW CARD */}
          <div className="bg-gradient-to-r from-orange-50/60 to-amber-50/40 border border-orange-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-orangeBrand/10 rounded-xl flex-shrink-0">
                <NearMe sx={{ fontSize: 18 }} className="text-orangeBrand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Selected Location
                </div>
                <p className="text-xs font-bold text-slate-700 leading-relaxed break-words">
                  {form.fullText ||
                    (form.lat
                      ? `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`
                      : "Location not selected")}
                </p>
              </div>
            </div>

            {/* Quick Detect & Autofill Button */}
            <button
              type="button"
              onClick={detectAndAutofill}
              disabled={autofillLoading}
              className={`
                mt-1 py-2 px-3.5 rounded-xl border flex items-center justify-center gap-2
                text-xs font-extrabold transition-all duration-200 active:scale-95 hover:scale-[1.01]
                ${autofillLoading
                  ? "bg-orange-50 border-orange-200 text-orangeBrand animate-pulse"
                  : "bg-white border-orange-200 text-orangeBrand hover:bg-orange-50 hover:shadow-sm"
                }
              `}
            >
              <MyLocation sx={{ fontSize: 14 }} className={autofillLoading ? "animate-spin" : ""} />
              <span>{autofillLoading ? autofillStatus : "Detect & Auto-fill Location Details"}</span>
            </button>
          </div>

          {/* ADDRESS TYPE SELECTOR */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5 block">
              Address Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {typeTags.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => update("typeTag", label)}
                  className={`
                    py-3 border rounded-2xl flex items-center justify-center gap-2
                    text-xs font-black transition-all duration-200 active:scale-95 hover:scale-[1.01]
                    ${form.typeTag === label
                      ? "bg-orange-50 border-orangeBrand text-orangeBrand shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-orangeBrand/30 hover:bg-slate-50"
                    }
                  `}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ============ ADDRESS FIELDS ============ */}
          <div className="space-y-3.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Address Details
            </label>

            {/* Flat / Floor */}
            <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all border border-slate-200 px-4 py-3 rounded-2xl focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
              <Apartment sx={{ fontSize: 18 }} className="text-slate-400 flex-shrink-0" />
              <input
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Flat / House No. / Floor"
                value={form.flat}
                onChange={(e) => update("flat", e.target.value)}
              />
            </div>

            {/* Building Name */}
            <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all border border-slate-200 px-4 py-3 rounded-2xl focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
              <MapsHomeWork sx={{ fontSize: 18 }} className="text-slate-400 flex-shrink-0" />
              <input
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Building / Society / Street Name"
                value={form.building}
                onChange={(e) => update("building", e.target.value)}
              />
            </div>

            {/* Landmark */}
            <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all border border-slate-200 px-4 py-3 rounded-2xl focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
              <LocationOn sx={{ fontSize: 18 }} className="text-slate-400 flex-shrink-0" />
              <input
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Nearby Landmark (optional)"
                value={form.landmark}
                onChange={(e) => update("landmark", e.target.value)}
              />
            </div>
          </div>

          {/* ============ VOICE & HELPLINE ============ */}
          <div className="flex gap-3">
            {/* Record */}
            <button
              onClick={recordInstructions}
              className={`
                flex-1 border rounded-2xl py-3 flex-shrink-0
                flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 hover:scale-[1.01] duration-200 hover:shadow-sm
                ${recording
                  ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                  : "bg-slate-50 border-slate-200 hover:border-orangeBrand/30 text-slate-700 hover:bg-slate-100"
                }
              `}
            >
              <Mic sx={{ fontSize: 16 }} className={recording ? "text-red-500" : "text-orangeBrand"} />
              <span>{recording ? "Recording..." : "Voice Record"}</span>
            </button>

            {/* Helpline */}
            <button
              onClick={callHelpline}
              className="
                flex-1 bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-100 rounded-2xl py-3 flex-shrink-0
                flex items-center justify-center gap-2 text-xs font-black text-emerald-700 transition-all hover:scale-[1.01] active:scale-95 hover:shadow-sm
              "
            >
              <PhoneEnabled sx={{ fontSize: 16 }} className="text-emerald-600" />
              <span>Helpline</span>
            </button>
          </div>

          {/* ============ FULL ADDRESS ============ */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5 block">
              Full Address
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all border border-slate-200 px-4 py-3 rounded-2xl focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
                <NearMe sx={{ fontSize: 18 }} className="text-slate-400 flex-shrink-0" />
                <input
                  className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Complete delivery address"
                  value={form.fullText}
                  onChange={(e) => update("fullText", e.target.value)}
                />
              </div>
              <VoiceInput onResult={(txt) => update("fullText", txt)} />
            </div>
          </div>

          {/* ============ RECEIVER DETAILS ============ */}
          <div className="space-y-3.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Receiver Details
            </label>

            {/* Name */}
            <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all border border-slate-200 px-4 py-3 rounded-2xl focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
              <Person sx={{ fontSize: 18 }} className="text-slate-400 flex-shrink-0" />
              <input
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Receiver's Full Name"
                value={form.receiverName}
                onChange={(e) => update("receiverName", e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all border border-slate-200 px-4 py-3 rounded-2xl focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
              <Phone sx={{ fontSize: 18 }} className="text-slate-400 flex-shrink-0" />
              <input
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Receiver's Phone Number"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>

          {/* ============ ACTION BUTTONS ============ */}
          <div className="flex items-center gap-3 pt-4 pb-2">
            <button
              className="
                flex-1 bg-orangeBrand hover:bg-orange-600 text-white py-3.5 rounded-2xl
                font-extrabold text-[14px] shadow-md hover:shadow-lg
                transition-all active:scale-95 duration-200
                flex items-center justify-center gap-2
              "
              onClick={handleSave}
            >
              <SaveAlt sx={{ fontSize: 18 }} />
              <span>Save Address</span>
            </button>

            <button
              className="
                flex-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-3.5 rounded-2xl
                font-extrabold text-[14px] hover:bg-slate-50
                transition-all active:scale-95 duration-200
              "
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
