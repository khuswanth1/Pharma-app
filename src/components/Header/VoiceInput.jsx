// src/components/Header/VoiceInput.jsx
import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "@mui/icons-material";
import {
  saveVoiceInstruction,
  loadVoiceInstruction,
  clearVoiceInstruction,
} from "../../utils/addressStorage";

export default function VoiceInput({ onResult }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  /* ---------------------------------------------------------
     LOAD previously stored voice text (if any)
  --------------------------------------------------------- */
  useEffect(() => {
    const savedText = loadVoiceInstruction();
    if (savedText && onResult) {
      onResult(savedText);
    }
    clearVoiceInstruction(); // optional remove after loading
  }, [onResult]);

  /* ---------------------------------------------------------
     SETUP SPEECH RECOGNITION
  --------------------------------------------------------- */
  useEffect(() => {
    const w = window;
    const SpeechRecognition =
      w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "en-IN";
    recog.interimResults = false;

    recog.onresult = async (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");

      // SEND TO PARENT (AddAddressModal)
      if (onResult) onResult(text);

      // SAVE TO LOCAL STORAGE
      saveVoiceInstruction(text);

      // SAVE TO API
      try {
        await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceText: text }),
        });
      } catch (err) {
        console.log("Voice API save failed → LocalStorage only");
      }

      setListening(false);
    };

    recog.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = recog;
  }, [onResult]);

  /* ---------------------------------------------------------
     START / STOP LISTENING
  --------------------------------------------------------- */
  const toggle = () => {
    const recog = recognitionRef.current;

    if (!recog) {
      console.log("Speech-to-text not supported");
      return;
    }

    if (!listening) {
      recog.start();
      setListening(true);
    } else {
      recog.stop();
      setListening(false);
    }
  };

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2.5 rounded-xl border flex items-center justify-center transition active:scale-95 duration-150 ${
        listening 
          ? "bg-red-50 border-red-200 text-red-600 animate-pulse" 
          : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-600"
      }`}
    >
      {listening ? <MicOff sx={{ fontSize: 18 }} /> : <Mic sx={{ fontSize: 18 }} />}
    </button>
  );
}
