import React, { useCallback, useEffect, useMemo, useRef, useState,} from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Close, Search } from "@mui/icons-material";

import { saveLastMapLocation, loadLastMapLocation,} from "../../utils/addressStorage";
import { backendReverseGeocode, backendGeocodeSearch } from "../../api/locationService";

const DEFAULT_CENTER = { lat: 17.385, lng: 78.4867 };
const MAP_HEIGHT = 420;

export default function LocationMapModal({ initialCoords, onCancel, onConfirm,}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [addrText, setAddrText] = useState("");
  const [addrComponents, setAddrComponents] = useState({});
  const [searchText, setSearchText] = useState("");

  const startMarker = useMemo(() => initialCoords || loadLastMapLocation() || DEFAULT_CENTER, [initialCoords]);
  const [marker, setMarker] = useState(startMarker);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const extractGeoapifyComponents = (properties) => {
    return {
      premise: "",
      building: properties.building || "",
      streetNumber: properties.house_number || "",
      route: properties.street || "",
      landmark: properties.suburb || "",
      sublocality: properties.district || properties.sublocality || "",
      locality: properties.city || "",
      city: properties.city || "",
      state: properties.state || "",
      country: properties.country || "",
      pincode: properties.postcode || "",
    };
  };

  const handleSearchSubmit = async (e) => {
    if (e.key === "Enter" && searchText.trim()) {
      try {
        const res = await backendGeocodeSearch(searchText);
        if (res && res.success && res.data && res.data.features && res.data.features[0]) {
          const firstFeature = res.data.features[0];
          const coords = firstFeature.geometry.coordinates; // [lng, lat]
          const pos = { lat: coords[1], lng: coords[0] };
          setMarker(pos);
          mapRef.current?.panTo(pos);
          setAddrText(firstFeature.properties.formatted || "");
          setAddrComponents(extractGeoapifyComponents(firstFeature.properties));
        } else {
          alert("Location not found. Please try a different search.");
        }
      } catch (err) {
        console.error("Geocode search failed:", err);
      }
    }
  };

  const mapCenter = useMemo(() => startMarker, [startMarker]);

  /* ===============================
     Extract structured components
  =============================== */
  const extractComponents = (result) => {
    const comps = result.address_components || [];
    const get = (...types) => {
      const found = comps.find((c) => types.some((t) => c.types.includes(t)));
      return found ? found.long_name : "";
    };

    return {
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
  };

  /* ===============================
     Reverse Geocode (Debounced)
  =============================== */
  const debouncedFetch = useRef(null);

  const fetchAddress = useCallback((lat, lng) => {
    if (debouncedFetch.current) clearTimeout(debouncedFetch.current);

    debouncedFetch.current = setTimeout(async () => {
      // 1) Try Google Maps Geocoder if key is defined
      if (window.google && window.google.maps && import.meta.env.VITE_GOOGLE_MAPS_KEY && import.meta.env.VITE_GOOGLE_MAPS_KEY !== "undefined") {
        const geocoder = new window.google.maps.Geocoder();
        try {
          const response = await geocoder.geocode({ location: { lat, lng } });
          const results = response?.results || response;
          if (results && results[0]) {
            setAddrText(results[0].formatted_address);
            setAddrComponents(extractComponents(results[0]));
            return;
          }
        } catch (err) {
          console.error("Google Geocode failed, falling back to Geoapify:", err);
        }
      }

      // 2) Fallback: Backend Geoapify Reverse Geocoding API
      try {
        const res = await backendReverseGeocode(lat, lng);
        if (res && res.success && res.data && res.data.features && res.data.features[0]) {
          const props = res.data.features[0].properties;
          setAddrText(props.formatted || "");
          setAddrComponents(extractGeoapifyComponents(props));
        }
      } catch (err) {
        console.error("Backend Geoapify Reverse Geocode failed:", err);
      }
    }, 300);
  }, []);

  useEffect(() => {
    fetchAddress(marker.lat, marker.lng);
  }, [marker, fetchAddress]);

  const onMapClick = (e) => {
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarker(pos);
    markerRef.current?.setPosition(pos);
  };

  const onPinDrag = (e) => {
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarker(pos);
  };

  const saveSelectedLocation = () => {
    const payload = {
      lat: marker.lat,
      lng: marker.lng,
      address: addrText,
      components: addrComponents,
    };

    saveLastMapLocation(payload);
    window.__PHARMA_TEMP_SELECTED_LOCATION = payload;

    onConfirm && onConfirm(payload);
  };

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* POPUP CARD */}
      <div
        className="
          relative bg-white rounded-[24px] shadow-2xl
          w-[92%] max-w-2xl max-h-[92vh] 
          overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100
        "
      >
        {/* HEADER + SEARCH BAR */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Select Delivery Location</h2>
            </div>
            <button 
              onClick={onCancel}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95"
            >
              <Close sx={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-2xl focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
            <Search sx={{ fontSize: 20 }} className="text-slate-400 flex-shrink-0" />
            <input
              placeholder="Search a new address or landmark..."
              className="bg-transparent w-full text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
          </div>
        </div>

        {/* MAP SECTION */}
        <div className="relative border-b border-slate-100">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: MAP_HEIGHT }}
            center={mapCenter}
            zoom={17}
            onLoad={(map) => (mapRef.current = map)}
            onClick={onMapClick}
          >
            <Marker
              position={marker}
              draggable
              onDragEnd={onPinDrag}
              onLoad={(mk) => (markerRef.current = mk)}
            />
          </GoogleMap>

          {/* Move map instruction */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-orangeBrand text-white font-extrabold text-xs rounded-full shadow-md uppercase tracking-wide">
            Move map or drag pin to adjust
          </div>
        </div>

        {/* ADDRESS + CONFIRM SECTION */}
        <div className="p-5 bg-white">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Selected Location</div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold text-slate-700 leading-relaxed shadow-inner">
            {addrText || "Pinpointing coordinates on map..."}
          </div>

          {/* Confirm Button */}
          <button
            onClick={saveSelectedLocation}
            className="mt-4 w-full bg-orangeBrand hover:bg-orange-600 text-white py-3 rounded-2xl font-extrabold text-[15px] shadow-md hover:shadow-lg transition active:scale-95 duration-200"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
