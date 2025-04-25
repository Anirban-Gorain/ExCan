import React from "react";

const Spinner = ({ size = "8", color = "blue-500" }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`h-${size} w-${size} border-4 border-${color} border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default Spinner;
