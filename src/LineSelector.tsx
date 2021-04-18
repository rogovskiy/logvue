import React from "react";

const LineSelector = ({ size, selected, onChange }) => {
  const color = selected ? "#add8e6" : "white";

  return (
    <svg height={size} width={size} onClick={() => onChange(!selected)}>
      <circle cx={size / 2} cy={size / 2} r={4} stroke="black" strokeWidth="1" fill={color} />
    </svg>
  );
};

export default LineSelector;
