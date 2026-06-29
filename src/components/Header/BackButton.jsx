import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";

const BackButton = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/home"); // 🔥 Navigates to Home.jsx route
  };

  return (
    <button
      onClick={goBack}
      className="flex items-center gap-3 px-2 py-2 bg-none text-black rounded-lg  transition"
    >
      <ArrowBack sx={{ fontSize: 20 }} />
      Back
    </button>
  );
};

export default BackButton;
