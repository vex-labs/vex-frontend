"use client";

import Sidebar2 from "@/components/Sidebar2";
import "./community.css";
import { useTour } from "@reactour/tour";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const CommunityPage = () => {
  const { currentStep } = useTour();
  const router = useRouter();

  useEffect(() => {
    if (currentStep === 15) {
      router.push("/leaderboard");
    }
  }, [currentStep, router]);

  return (
    <div className="mainContent">
      <Sidebar2 />
      <div className="container community-content">
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

export default CommunityPage;
