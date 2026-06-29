import React from "react";
import { Routes, Route } from "react-router-dom";

import TemplateDetail from "./Detail/TemplateDetail";

export default function ProductDetail() {
  return (
    <Routes>
      {/* MUST MATCH categorySlug + id */}
      <Route path="Detail/:categorySlug/:id" element={<TemplateDetail />} />
    </Routes>
  );
}
