import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Mic, MicOff, History, Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { searchProducts } from "../../api/productService";
import { toast } from "react-toastify";

const SearchBar = () => {
  const [q, setQ] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const containerRef = useRef(null);

  const navigate = useNavigate();

  // Speech Recognition API instance
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-IN"; // Matches English (India) pronunciation
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQ(transcript);
        saveHistory(transcript);
        navigate(`/searchresults?query=${encodeURIComponent(transcript)}`);
        setShowSuggestions(false);
        toast.success(`Searching for: "${transcript}" 🎙️`);
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        toast.error("Could not capture speech. Try again.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.warn("Speech recognition is not supported in this browser. Try Chrome!");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  /* -----------------------------------------
     LOAD SEARCH HISTORY
  ----------------------------------------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("searchHistory")) || [];
    setHistory(saved);
  }, []);

  /* -----------------------------------------
     DEBOUNCE SEARCH TYPING (300ms)
  ----------------------------------------- */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(q);
    }, 300);

    return () => clearTimeout(timeout);
  }, [q]);

  /* -----------------------------------------
     CLICK OUTSIDE TO CLOSE SUGGESTIONS
  ----------------------------------------- */
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* -----------------------------------------
     FETCH SUGGESTIONS FROM BACKEND API
  ----------------------------------------- */
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }

    let active = true;
    setLoadingSuggestions(true);
    searchProducts(debouncedQuery.trim()).then((data) => {
      if (active) {
        setSuggestions(Array.isArray(data) ? data : []);
        setLoadingSuggestions(false);
      }
    });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  /* -----------------------------------------
     HANDLE SEARCH SUBMIT
  ----------------------------------------- */
  const onSubmit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;

    saveHistory(q);
    navigate(`/searchresults?query=${encodeURIComponent(q)}`);

    // Reset
    setQ("");
    setShowSuggestions(false);
  };

  /* -----------------------------------------
     SAVE SEARCH HISTORY (Max 5)
  ----------------------------------------- */
  const saveHistory = (text) => {
    let newHistory = [text, ...history.filter((h) => h !== text)];
    newHistory = newHistory.slice(0, 5);

    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const handleRemoveHistoryItem = (text) => {
    const newHistory = history.filter((h) => h !== text);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ⭐ INPUT BOX ⭐ */}
      <form onSubmit={onSubmit}>
        <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 dark:focus-within:ring-orange-950/20 rounded-full px-4 py-2.5 shadow-sm transition-all duration-200">
          <Search className="text-gray-400 dark:text-slate-500 flex-shrink-0" sx={{ fontSize: 24 }} />
          <input
            className="w-full ml-2.5 bg-transparent outline-none text-[13.5px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium search-input-field"
            placeholder={isListening ? "Listening... Speak now!" : "Search medicines, wellness & health items..."}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowSuggestions(true);
            }}
          />
          {loadingSuggestions && (
            <div className="w-5 h-5 border-2 border-orangeBrand border-t-transparent rounded-full animate-spin mr-2 flex-shrink-0"></div>
          )}
          <button 
            type="button" 
            onClick={handleVoiceSearch}
            className={`p-1.5 rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none ${
              isListening 
                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500 animate-pulse" 
                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400"
            }`}
            title="Search with Voice"
          >
            {isListening ? <MicOff sx={{ fontSize: 20 }} /> : <Mic sx={{ fontSize: 20 }} />}
          </button>
        </div>
      </form>

      {/* ⭐ SUGGESTIONS DROPDOWN ⭐ */}
      {showSuggestions && (suggestions.length > 0 || history.length > 0) && (
        <div
          className="absolute left-0 right-0 bg-white dark:bg-slate-900 shadow-xl rounded-2xl mt-2 border border-slate-100/80 dark:border-slate-800
                     max-h-72 overflow-y-auto z-[999] p-2 w-full animate-in fade-in duration-200"
        >
          {/* LAST SEARCHES */}
          {history.length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2 mb-1.5 mt-1 select-none">
                Recent Searches
              </p>
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition group"
                >
                  <div
                    onClick={() => {
                      navigate(`/searchresults?query=${encodeURIComponent(h)}`);
                      setQ("");
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0"
                  >
                    <History className="text-gray-400 dark:text-slate-500 flex-shrink-0" sx={{ fontSize: 18 }} />
                    <span className="truncate">{h}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveHistoryItem(h);
                    }}
                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    title="Remove search"
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </button>
                </div>
              ))}
              <hr className="my-2 border-slate-50 dark:border-slate-800/60" />
            </>
          )}

          {/* PRODUCT RESULTS */}
          {suggestions.length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2 mb-1.5 mt-1 select-none">
                Suggested Products
              </p>
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    navigate(`/searchresults?query=${encodeURIComponent(item.name)}`);
                    setQ("");
                    setShowSuggestions(false);
                  }}
                  className="flex items-center px-3 py-2 hover:bg-orange-50/40 dark:hover:bg-orange-950/20 hover:text-orangeBrand dark:hover:text-orange-400 cursor-pointer gap-2.5 rounded-xl transition text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Search className="text-gray-400 dark:text-slate-500 flex-shrink-0" sx={{ fontSize: 18 }} />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
