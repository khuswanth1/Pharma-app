import React from "react";

const DiabetesBanner = () => {
  return (
    <div
      className="
        w-full 
        bg-blue-50 
        rounded-2xl 
        overflow-hidden 
        shadow-md 
        flex flex-col md:flex-row 
        items-center 
        md:items-start 
        gap-6 
        p-6 
        pb-6
        md:p-10
      "
    >
      {/* IMAGE */}
      <div className="w-full md:w-1/2 flex justify-center">
        <img
          src="/assets/banners/diabetes-banner.png"  // ← change to your diabetes banner image path
          alt="Diabetes Care"
          className="w-full max-w-md object-contain"
        />
      </div>

      {/* TEXT CONTENT */}
      <div className="w-full md:w-1/2">
        <h2 className="text-3xl font-bold text-blue-700 mb-3">
          Complete Diabetes Care
        </h2>

        <p className="text-gray-700 text-lg leading-relaxed">
          Manage your diabetes with top-rated medicines, insulin supplies,
          glucometers, test strips, and daily essentials.  
          Trusted brands, verified products, and fast delivery to support your
          daily health needs.
        </p>
      </div>
    </div>
  );
};

export default DiabetesBanner;
