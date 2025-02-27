"use client";

import Sidebar2 from "@/components/Sidebar2";
import "./governance.css";

const GovernancePage = () => {
  return (
    <div className="mainContent">
      <Sidebar2 />
      <div className="container governance-content">
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#fff", // Or any color you prefer
            textAlign: "center",
          }}
        >
          Coming Soon
        </h2>
      </div>
    </div>
  );
};

export default GovernancePage;
