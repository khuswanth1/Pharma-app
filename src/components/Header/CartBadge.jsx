// src/components/Cart/CartBadge.jsx
import React from "react";

const CartBadge = ({ count }) => {
  if (!count) return null;
  return (

    <>
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">
      {count}
    </span>
    </>
  );
};

export default CartBadge;
