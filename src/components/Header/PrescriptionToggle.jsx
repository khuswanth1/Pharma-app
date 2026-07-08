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
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 transition active:scale-95 duration-150"
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
