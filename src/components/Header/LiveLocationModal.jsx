import React, { useState, useEffect } from "react";
import { Close, Add, ChevronRight, MyLocation, Search, Mic, PhoneEnabled,} from "@mui/icons-material";

import LocationMapModal from "./LocationMapModal";
import AddAddressModal from "./AddAddressModal";
import SavedAddresses from "./SavedAddresses";

import {
  saveVoiceInstruction,
  setPrimaryAddress,
} from "../../utils/addressStorage";

export default function LiveLocationModal({ onClose }) {
  const [step, setStep] = useState("main");
  const [coords, setCoords] = useState(null);
  const [recording, setRecording] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);

  /* --------------------------------------------------------
     GOOGLE PLACES AUTOCOMPLETE SEARCH
     -------------------------------------------------------- */
  useEffect(() => {
    if (!searchQuery) {
      setPredictions([]);
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    const autocompleteService = new window.google.maps.places.AutocompleteService();
    
    const delayDebounce = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        { input: searchQuery, componentRestrictions: { country: "in" } },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectPrediction = (placeId) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        const result = results[0];
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        
        const comps = result.address_components || [];
        const get = (...types) => {
          const found = comps.find((c) => types.some((t) => c.types.includes(t)));
          return found ? found.long_name : "";
        };

        const components = {
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

        setCoords({ lat, lng });
        setLocationData({
          lat,
          lng,
          address: result.formatted_address,
          components
        });
        setStep("map");
      }
    });
  };

  const recordInstructions = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";

    rec.onstart = () => setRecording(true);
    rec.onend = () => setRecording(false);

    rec.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      saveVoiceInstruction(spoken);
      setStep("add");
    };

    rec.start();
  };

  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStep("map");
      },
      (err) => {
        alert("GPS access denied or unavailable. Please enable browser location permissions.");
      }
    );
  };

  const handleAddressUse = (addr) => {
    // 1) Mark this address as primary
    setPrimaryAddress(addr.id);

    // 2) Notify header to refresh location text
    window.dispatchEvent(new Event("storage"));

    // 3) Close main modal
    if (onClose) onClose();
  };

  const callHelpline = () => (window.location.href = "tel:+919000000000");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-200">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* POPUP CARD */}
      <div
        className="
          relative bg-white rounded-[24px] shadow-2xl
          w-full max-w-xl 
          max-h-[85vh] overflow-y-auto
          animate-in zoom-in-95 duration-200
          border border-slate-100 flex flex-col no-scrollbar
        "
      >
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-wide">Select Location</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95"
          >
            <Close sx={{ fontSize: 20 }} />
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="px-5 pt-5">
          <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all border border-slate-200 px-4 py-3 rounded-2xl shadow-inner focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20">
            <Search sx={{ fontSize: 20 }} className="text-slate-400 flex-shrink-0" />
            <input
              placeholder="Search delivery address or landmark..."
              className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* SEARCH RESULTS FROM GOOGLE PLACES SUGGESTIONS */}
        {predictions.length > 0 && (
          <div className="px-5 mt-4 max-h-60 overflow-y-auto space-y-2 no-scrollbar">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Search Results
            </div>
            {predictions.map((p) => (
              <button
                key={p.place_id}
                type="button"
                onClick={() => handleSelectPrediction(p.place_id)}
                className="w-full text-left p-3 bg-slate-50 hover:bg-orange-50/50 hover:text-orangeBrand border border-slate-100 rounded-xl transition duration-150 flex items-start gap-2.5 active:scale-[0.99]"
              >
                <span className="text-[14px] text-orangeBrand mt-0.5">📍</span>
                <div>
                  <span className="text-xs font-bold block leading-tight text-slate-800">
                    {p.structured_formatting.main_text}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-none">
                    {p.structured_formatting.secondary_text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* MAIN BUTTONS */}
        <div className="px-5 mt-5 space-y-3">
          {/* Use Current Location */}
          <button
            onClick={useCurrentLocation}
            className="
              w-full bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4
              flex items-center justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-95
            "
          >
            <div className="flex items-center gap-3.5">
              <MyLocation sx={{ fontSize: 20 }} className="text-orangeBrand animate-pulse" />
              <div className="text-left">
                <span className="text-[14px] font-black text-orangeBrand block">Use my Current Location</span>
                <span className="text-[10px] text-orangeBrand-light font-bold block mt-0.5">Locate via GPS for instant delivery details</span>
              </div>
            </div>
            <ChevronRight sx={{ fontSize: 18 }} className="text-orangeBrand" />
          </button>

          {/* Add New Address */}
          <button
            onClick={() => setStep("add")}
            className="
              w-full bg-white border border-slate-200 hover:border-orangeBrand/30 rounded-2xl px-5 py-4
              flex items-center justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-95
            "
          >
            <div className="flex items-center gap-3.5">
              <Add sx={{ fontSize: 20 }} className="text-orangeBrand" />
              <div className="text-left">
                <span className="text-[14px] font-black text-slate-800 block">Add New Address</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Manually type full flat, building, or street details</span>
              </div>
            </div>
            <ChevronRight sx={{ fontSize: 18 }} className="text-slate-400" />
          </button>

          {/* Request From Friend */}
          <button
            onClick={() =>
              window.open("https://wa.me/?text=Share your address")
            }
            className="
              w-full bg-[#25D366]/5 hover:bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl px-5 py-4
              flex items-center justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-95
            "
          >
            <div className="flex items-center gap-3.5">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                className="w-5 h-5 flex-shrink-0"
                alt="whatsapp"
              />
              <div className="text-left">
                <span className="text-[14px] font-black text-[#128C7E] block">Request address from a friend</span>
                <span className="text-[10px] text-[#128C7E]/75 font-bold block mt-0.5">Quickly share location request link on WhatsApp</span>
              </div>
            </div>
            <ChevronRight sx={{ fontSize: 18 }} className="text-[#128C7E]" />
          </button>
        </div>

        {/* RECORD + HELPLINE — SIDE BY SIDE */}
        <div className="px-5 mt-4 flex gap-4">
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
            <span>Helpline Support</span>
          </button>
        </div>

        <div className="px-5 pb-6">
          <SavedAddresses
            searchQuery={searchQuery}
            onSelect={handleAddressUse}
            onEdit={(addr) => setStep({ mode: "edit", data: addr })}
            onClose={onClose}
          />
        </div>

        {/* MAP & ADD ADDRESS MODALS */}
        {step === "map" && (
          <LocationMapModal
            initialCoords={coords}
            onCancel={() => setStep("main")}
            onConfirm={(payload) => {
              setLocationData(payload);
              setStep("add");
            }}
          />
        )}

        {step === "add" && (
          <AddAddressModal
            initialCoords={coords}
            editingAddress={null}
            locationPayload={locationData}
            onSaved={() => { setLocationData(null); setStep("main"); }}
            onCancel={() => { setLocationData(null); setStep("main"); }}
          />
        )}

        {typeof step === "object" && step.mode === "edit" && (
          <AddAddressModal
            editingAddress={step.data}
            onSaved={() => setStep("main")}
            onCancel={() => setStep("main")}
          />
        )}
      </div>
    </div>
  );
}
