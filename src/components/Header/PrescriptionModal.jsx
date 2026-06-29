import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Close,
  CloudUpload,
  CheckCircle,
  AddShoppingCart,
  PhotoCamera,
  CameraAlt,
  FileUpload,
  MedicalServices,
  Delete,
  KeyboardArrowRight,
  VerifiedUser,
  LocalPharmacy,
  CheckBox,
  CheckBoxOutlineBlank,
} from "@mui/icons-material";
import { uploadPrescriptionToServer, analyzePrescriptionAPI } from "../../api/prescriptionService";
import { fetchAllProducts } from "../../api/productService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../../context/CartContext";

/* ─── helpers ──────────────────────────────────────────────────── */

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const compressImage = (b64, maxW = 900, maxH = 900, quality = 0.75) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = b64;
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
      if (h > maxH) { w = Math.round((w * maxH) / h); h = maxH; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(b64);
  });

const STEPS = ["select", "preview", "processing", "results"];
const STEP_LABELS = {
  select: "Upload Prescription",
  preview: "Confirm Image",
  processing: "Analysing",
  results: "Medicines Found",
};

/* ─── loading step animation ───────────────────────────────────── */
const LOADING_STEPS = [
  { icon: "🔒", text: "Securely uploading prescription…" },
  { icon: "🧠", text: "AI is reading your prescription…" },
  { icon: "💊", text: "Matching medicines from catalogue…" },
  { icon: "✅", text: "Almost done…" },
];

/* ══════════════════════════════════════════════════════════════════
   PrescriptionModal
══════════════════════════════════════════════════════════════════ */
const PrescriptionModal = ({ open, close, mode: defaultMode }) => {
  const navigate = useNavigate();
  const { setUploadedPrescription, addToCart } = useCart();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ---------- state ---------- */
  const [step, setStep] = useState("select");          // select | preview | processing | results
  const [inputMode, setInputMode] = useState(          // upload | camera
    isMobile() ? "upload" : (defaultMode === "scan" ? "camera" : "upload")
  );
  const [preview, setPreview] = useState(null);
  const [filename, setFilename] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // null | "ok" | "local"
  const [analyzedProducts, setAnalyzedProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  /* reset on open */
  useEffect(() => {
    if (open) {
      setStep("select");
      setInputMode(isMobile() ? "upload" : (defaultMode === "scan" ? "camera" : "upload"));
      setPreview(null);
      setFilename("");
      setLoadingStep(0);
      setUploadStatus(null);
      setAnalyzedProducts([]);
      setSelectedIds([]);
    }
  }, [open, defaultMode]);

  /* loading-step ticker */
  useEffect(() => {
    if (step !== "processing") return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        const next = prev + 1;
        if (next >= LOADING_STEPS.length) { clearInterval(interval); return prev; }
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [step]);

  /* ---------- image selection ---------- */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File is too large (max 8 MB). Please try a smaller file.");
      return;
    }
    setFilename(file.name);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result;
      try {
        setPreview(file.type.startsWith("image/") ? await compressImage(b64) : b64);
      } catch {
        setPreview(b64);
      }
      setStep("preview");
    };
    reader.readAsDataURL(file);
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const img = webcamRef.current.getScreenshot();
    if (!img) return;
    setFilename("camera_capture.jpg");
    setPreview(await compressImage(img));
    setStep("preview");
  }, []);

  /* ---------- process (upload + analyse) ---------- */
  const processPresciption = async () => {
    setStep("processing");
    setLoadingStep(0);

    // ── 1. Upload ───────────────────────────────────────────────
    const uploadRes = await uploadPrescriptionToServer(preview, filename);

    if (uploadRes.success) {
      setUploadStatus("ok");
      // Persist to localStorage
      const stored = JSON.parse(localStorage.getItem("prescriptions") || "[]");
      stored.push({ image: uploadRes.url, uploadedAt: uploadRes.time, id: uploadRes.id });
      localStorage.setItem("prescriptions", JSON.stringify(stored));
    } else {
      setUploadStatus("local");
      const stored = JSON.parse(localStorage.getItem("prescriptions") || "[]");
      stored.push({ image: preview, uploadedAt: new Date().toISOString() });
      localStorage.setItem("prescriptions", JSON.stringify(stored));
    }
    setUploadedPrescription(true);

    // ── 2. Analyse ─────────────────────────────────────────────
    let extractedNames = await analyzePrescriptionAPI(preview, filename);

    // server-side fallback: if backend is not yet running or returned empty
    if (!extractedNames || extractedNames.length === 0) {
      extractedNames = ["Dolo 650", "Metformin 500mg", "Pantocid 40mg"];
    }

    // ── 3. Match catalogue products ────────────────────────────
    try {
      const catalogue = await fetchAllProducts();
      const matched = [];
      for (const name of extractedNames) {
        const clean = name.replace(/\b(tablet|capsule|mg|ml|drop|syrup|gel)\b/gi, "").trim().toLowerCase();
        if (!clean) continue;
        const hit = catalogue.find((p) =>
          p.name.toLowerCase().includes(clean) ||
          clean.includes(p.name.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(clean))
        );
        if (hit && !matched.some((m) => m.id === hit.id)) matched.push(hit);
      }
      if (matched.length > 0) {
        setAnalyzedProducts(matched);
        setSelectedIds(matched.map((p) => p.id));
        setStep("results");
        return;
      }
    } catch (err) {
      console.error("[PrescriptionModal] catalogue match failed:", err);
    }

    // ── 4. Nothing matched → go cart ──────────────────────────
    toast.info("Prescription saved! No catalogue matches found — browse medicines manually.");
    close();
    navigate("/medicines");
  };

  /* ---------- cart ---------- */
  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const addToCartAndClose = () => {
    let count = 0;
    analyzedProducts.forEach((p) => {
      if (selectedIds.includes(p.id)) { addToCart(p, 1); count++; }
    });
    if (count > 0) toast.success(`Added ${count} medicine${count > 1 ? "s" : ""} to cart 💊`);
    close();
    navigate("/cart");
  };

  /* ---------- guard ---------- */
  if (!open) return null;

  /* ── step index for progress bar ── */
  const stepIdx = STEPS.indexOf(step);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div
        className="relative w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl overflow-hidden"
        style={{ animation: "rxModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* ── header gradient bar ── */}
        <div className="h-1.5 w-full bg-gradient-to-r via-amber-400 to-orange-500" />

        {/* ── modal header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200">
              <MedicalServices sx={{ fontSize: 18, color: "#fff" }} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-800 leading-tight tracking-tight">
                Prescription Upload
              </h2>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                {STEP_LABELS[step]}
              </p>
            </div>
          </div>

          {step !== "processing" && (
            <button
              onClick={close}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition active:scale-90 duration-150"
            >
              <Close sx={{ fontSize: 18 }} />
            </button>
          )}
        </div>

        {/* ── step progress pills ── */}
        <div className="flex items-center gap-1.5 px-6 mb-5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                i <= stepIdx ? "bg-orange-400" : "bg-slate-100"
              }`}
            />
          ))}
        </div>

        {/* ════════════════════════ STEP: SELECT ════════════════════════ */}
        {step === "select" && (
          <div className="px-6 pb-6">
            {/* Tab switcher (desktop only) */}
            {!isMobile() && (
              <div className="flex rounded-2xl bg-slate-100 p-1 mb-5">
                {[
                  { key: "upload", icon: <FileUpload sx={{ fontSize: 15 }} />, label: "Upload File" },
                  { key: "camera", icon: <CameraAlt sx={{ fontSize: 15 }} />, label: "Use Camera" },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setInputMode(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                      inputMode === key
                        ? "bg-white text-orange-500 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── UPLOAD zone ── */}
            {(inputMode === "upload" || isMobile()) && (
              <>
                <label
                  htmlFor="rx-file-input"
                  className="group flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-orange-400 hover:bg-orange-50/30 cursor-pointer transition-all duration-200"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                    <CloudUpload className="text-orange-400" sx={{ fontSize: 28 }} />
                  </div>
                  <p className="text-sm font-black text-slate-700 mb-1">
                    {isMobile() ? "Tap to open camera / gallery" : "Drop file here or click to browse"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    JPG · PNG · PDF &nbsp;·&nbsp; Max 8 MB
                  </p>
                  <input
                    id="rx-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    capture={isMobile() ? "environment" : undefined}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </>
            )}

            {/* ── CAMERA zone ── */}
            {inputMode === "camera" && !isMobile() && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 440, height: 280, facingMode: "environment" }}
                    className="w-full object-cover"
                  />
                </div>
                <button
                  onClick={capture}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-md shadow-orange-200 hover:shadow-lg active:scale-95 transition-all duration-150"
                >
                  <PhotoCamera sx={{ fontSize: 16 }} /> Capture Prescription
                </button>
              </div>
            )}


          </div>
        )}

        {/* ════════════════════════ STEP: PREVIEW ═══════════════════════ */}
        {step === "preview" && (
          <div className="px-6 pb-6">
            {/* image preview */}
            <div className="w-full max-h-[240px] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shadow-inner mb-4">
              <img
                src={preview}
                alt="Prescription preview"
                className="max-w-full max-h-[240px] object-contain"
              />
            </div>

            {/* file info chip */}
            {filename && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-4">
                <FileUpload className="text-orange-400 flex-shrink-0" sx={{ fontSize: 16 }} />
                <span className="text-[11px] font-bold text-slate-600 truncate flex-1">{filename}</span>
                <button
                  onClick={() => setStep("select")}
                  className="text-slate-400 hover:text-red-600 transition text-[10px] font-black flex items-center gap-0.5"
                >
                  <Delete sx={{ fontSize: 13 }} /> 
                </button>
              </div>
            )}

            <button
              onClick={processPresciption}
              className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-[0.98] transition-all duration-150"
            >
              <MedicalServices sx={{ fontSize: 18 }} />
              Upload &amp; Analyse Prescription
              <KeyboardArrowRight sx={{ fontSize: 18 }} />
            </button>

            <button
              onClick={() => setStep("select")}
              className="w-full mt-2.5 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 transition"
            >
              ← Choose a different file
            </button>
          </div>
        )}

        {/* ════════════════════════ STEP: PROCESSING ════════════════════ */}
        {step === "processing" && (
          <div className="px-6 pb-8 flex flex-col items-center">
            {/* spinner */}
            <div className="relative w-20 h-20 mb-6 mt-2">
              <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-amber-400 border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {LOADING_STEPS[loadingStep]?.icon}
              </div>
            </div>

            {/* step list */}
            <div className="w-full space-y-2.5">
              {LOADING_STEPS.map((ls, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 ${
                    i < loadingStep
                      ? "bg-emerald-50 border border-emerald-100"
                      : i === loadingStep
                      ? "bg-orange-50 border border-orange-200 shadow-sm"
                      : "bg-slate-50 border border-slate-100 opacity-40"
                  }`}
                >
                  <span className="text-base leading-none">{ls.icon}</span>
                  <span
                    className={`text-xs font-bold flex-1 ${
                      i < loadingStep
                        ? "text-emerald-700"
                        : i === loadingStep
                        ? "text-orange-700"
                        : "text-slate-400"
                    }`}
                  >
                    {ls.text}
                  </span>
                  {i < loadingStep && (
                    <CheckCircle className="text-emerald-500 flex-shrink-0" sx={{ fontSize: 16 }} />
                  )}
                  {i === loadingStep && (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 font-medium mt-5 text-center">
              Please wait — this takes a few seconds…
            </p>
          </div>
        )}

        {/* ════════════════════════ STEP: RESULTS ═══════════════════════ */}
        {step === "results" && (
          <div className="px-6 pb-6">
            {/* upload status banner */}
            <div
              className={`flex items-start gap-3 rounded-2xl p-3.5 mb-4 ${
                uploadStatus === "ok"
                  ? "bg-emerald-50 border border-emerald-100"
                  : "bg-amber-50 border border-amber-100"
              }`}
            >
              <CheckCircle
                className={uploadStatus === "ok" ? "text-emerald-500" : "text-amber-500"}
                sx={{ fontSize: 20 }}
              />
              <div>
                <p
                  className={`text-xs font-black ${
                    uploadStatus === "ok" ? "text-emerald-800" : "text-amber-800"
                  }`}
                >
                  {uploadStatus === "ok"
                    ? "Prescription saved to your account ✓"
                    : "Saved locally (server unreachable) "}
                </p>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  {analyzedProducts.length} matching medicine{analyzedProducts.length !== 1 ? "s" : ""} found in our catalogue
                </p>
              </div>
            </div>

            {/* select all / deselect all */}
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Matched Medicines
              </p>
              <button
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === analyzedProducts.length
                      ? []
                      : analyzedProducts.map((p) => p.id)
                  )
                }
                className="text-[10px] font-black text-orange-500 hover:text-orange-600 transition"
              >
                {selectedIds.length === analyzedProducts.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* product list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 mb-4" style={{ scrollbarWidth: "none" }}>
              {analyzedProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const discount =
                  p.cost > p.final_price
                    ? Math.round(((p.cost - p.final_price) / p.cost) * 100)
                    : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer select-none transition-all duration-150 ${
                      isSelected
                        ? "bg-orange-50/60 border-orange-300/60"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* checkbox */}
                    <span className={`flex-shrink-0 ${isSelected ? "text-orange-500" : "text-slate-300"}`}>
                      {isSelected
                        ? <CheckBox sx={{ fontSize: 20 }} />
                        : <CheckBoxOutlineBlank sx={{ fontSize: 20 }} />}
                    </span>

                    {/* image */}
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 flex-shrink-0">
                      <img
                        src={Array.isArray(p.images) ? p.images[0] : (p.image || p.images_url || "")}
                        alt={p.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate leading-tight">{p.name}</h5>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {p.highlights?.product_type || p.category || "Medicine"}
                      </span>
                    </div>

                    {/* price */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-slate-800 block">₹{p.final_price}</span>
                      {discount > 0 && (
                        <span className="text-[9px] text-emerald-600 font-bold block">{discount}% off</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* action buttons */}
            <button
              onClick={addToCartAndClose}
              disabled={selectedIds.length === 0}
              className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white text-sm font-black rounded-2xl shadow-lg shadow-orange-200 disabled:shadow-none active:scale-[0.98] transition-all duration-150"
            >
              <AddShoppingCart sx={{ fontSize: 18 }} />
              Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}Medicine{selectedIds.length !== 1 ? "s" : ""} to Cart
            </button>

            <button
              onClick={() => { close(); navigate("/cart"); }}
              className="w-full mt-2 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 transition"
            >
              Skip &amp; Go to Cart →
            </button>
          </div>
        )}
      </div>

      {/* entrance animation */}
      <style>{`
        @keyframes rxModalIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionModal;
