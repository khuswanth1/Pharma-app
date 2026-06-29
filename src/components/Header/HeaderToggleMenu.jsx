// src/components/Header/HeaderToggleMenu.jsx
import React from "react";
import { PhotoCamera, Upload, LocationOn, Close } from "@mui/icons-material";
import {useNavigate } from "react-router-dom";

const HeaderToggleMenu = ({ menuOpen, closeMenu }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 
      transform transition-transform duration-300 
      ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="p-5">

        {/* Close Button */}
        <button className="absolute top-4 right-4" onClick={closeMenu}>
          <Close sx={{ fontSize: 22 }} />
        </button>

        <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>

        <div className="flex flex-col gap-5">

          {/* Scanner */}
          <button
            className="flex items-center gap-3 text-gray-700 hover:text-orange-600"
            onClick={() => {
              alert("Scanner open (connect react-webcam later)");
              closeMenu();
            }}
          >
            <PhotoCamera sx={{ fontSize: 20 }} /> Scan Prescription
          </button>

          {/* Upload */}
          <label className="flex items-center gap-3 text-gray-700 hover:text-orange-600 cursor-pointer">
            <Upload sx={{ fontSize: 20 }} /> Upload Prescription
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) alert(`Uploaded: ${f.name}`);
                closeMenu();
              }}
            />
          </label>

          {/* Order Tracking */}
          <button
            className="flex items-center gap-3 text-gray-700 hover:text-orange-600"
            onClick={() => {
              closeMenu();
              navigate("/order-tracking/id:");
            }}
          >
            <LocationOn sx={{ fontSize: 20 }} /> Order Tracking
          </button>

          {/* Manage Addresses */}
          <button
            className="flex items-center gap-3 text-gray-700 hover:text-orange-600"
            onClick={() => {
              closeMenu();
              navigate("/addresses");
            }}
          >
            <LocationOn sx={{ fontSize: 20 }} /> Manage Addresses
          </button>
        </div>

      </div>
    </div>
  );
};

export default HeaderToggleMenu;
