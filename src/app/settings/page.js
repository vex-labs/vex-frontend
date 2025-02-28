"use client";

import Sidebar2 from "@/components/Sidebar2";
import "./settings.css";

const SettingsPage = () => {
  return (
    <div className="mainContent">
      <Sidebar2 />
      <div className="container settings-content">
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#fff", // Or any color you prefer
            textAlign: "center",
          }}
        >
          Settings
        </h2>
      </div>
    </div>
  );
};

export default SettingsPage;
