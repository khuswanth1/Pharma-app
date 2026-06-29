import React, { useState } from "react";
import { Upload } from "@mui/icons-material";
import PrescriptionModal from "./PrescriptionModal";

const PrescriptionToggle = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Upload Button */}
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition active:scale-95 duration-150"
        >
          <Upload sx={{ fontSize: 16 }} className="text-orangeBrand" /> Upload
        </button>
      </div>

      {/* Modal */}
      <PrescriptionModal
        open={open}
        close={() => setOpen(false)}
        mode="upload"
      />
    </>
  );
};

export default PrescriptionToggle;
