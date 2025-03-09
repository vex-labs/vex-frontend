"use client";
import { useState, useEffect } from "react";
import Sidebar2 from "@/components/Sidebar2";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import { useNear } from "@/app/context/NearContext";
import "./settings.css";

const SettingsPage = () => {
  const { web3auth, accountId: web3authAccountId } = useWeb3Auth();
  const { signedAccountId } = useNear();
  const queryClient = useQueryClient();
  const [recommendedMatches, setRecommendedMatches] = useState(true);

  const accountId = web3auth?.connected ? web3authAccountId : signedAccountId;

  const userData = useQuery({
    queryKey: ["userData"],
    enabled: !!accountId,
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: accountId,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          `Failed to fetch user data: ${data.error || data.message}`
        );
      }
      return data;
    },
  });

  // Update local state when user data is loaded
  useEffect(() => {
    if (userData.data?.user?.recommended_matches_on !== undefined) {
      setRecommendedMatches(userData.data.user.recommended_matches_on);
    }
  }, [userData.data]);

  const updateRecommendedMatches = useMutation({
    mutationFn: async (newValue) => {
      const res = await fetch("/api/auth/user/recommended-matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: accountId,
          recommendedMatches: newValue ? true : false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update setting");
      }

      return await res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user data after successful update
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
  });

  const handleToggleChange = () => {
    const newValue = !recommendedMatches;
    setRecommendedMatches(newValue); // Update local state immediately for responsive UI
    updateRecommendedMatches.mutate(newValue);
  };

  // Determine if the toggle should be disabled
  const isToggleDisabled =
    userData.isLoading ||
    userData.isFetching ||
    !userData.data ||
    updateRecommendedMatches.isPending;

  return (
    <div className="mainContent">
      <Sidebar2 />
      <div className="container settings-content">
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          Settings
        </h2>

        <div className="settings-section">
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-label">
                <h3>Recommended Matches</h3>
                <p>
                  Show personalized match recommendations based on your activity
                </p>
                {userData.isLoading && (
                  <span className="settings-loading">
                    Loading your preferences...
                  </span>
                )}
              </div>
              <div
                className={`toggle-switch ${
                  isToggleDisabled ? "toggle-disabled" : ""
                }`}
              >
                <input
                  type="checkbox"
                  id="recommendedMatches"
                  className="toggle-input"
                  checked={recommendedMatches}
                  onChange={handleToggleChange}
                  disabled={isToggleDisabled}
                />
                <label
                  htmlFor="recommendedMatches"
                  className="toggle-label"
                ></label>
              </div>
            </div>

            {updateRecommendedMatches.isError && (
              <div className="settings-error">
                Failed to update setting. Please try again.
              </div>
            )}

            {updateRecommendedMatches.isSuccess && (
              <div className="settings-success">
                Setting updated successfully.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
