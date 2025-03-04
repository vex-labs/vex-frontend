// hooks/useTour.js
import { useState, useEffect, useCallback, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_CONFIG = {
  main: {
    showProgress: true,
    animate: true,
    allowClose: true,
    stagePadding: 10,
    overlayClickNext: false,
    closeButton: true,
    escapeToClose: true,
    smoothScroll: true,
    doneBtnText: "Done",
    nextBtnText: "Next",
    prevBtnText: "Previous",
    popoverClass: "driverjs-theme",
    showButtons: ["close", "next", "previous"],
  },
  modal: {
    showProgress: false,
    animate: true,
    allowClose: true,
    stagePadding: 5,
    popoverClass: "driverjs-theme modal-tour",
    showButtons: ["close"],
  },
};

export function useTour() {
  const driverRef = useRef(null);
  const modalDriverRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const loginCheckedRef = useRef(false);

  const cleanup = useCallback(() => {
    try {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
      if (modalDriverRef.current) {
        modalDriverRef.current.destroy();
      }
      setIsRunning(false);
    } catch (error) {
      console.error("Tour cleanup error:", error);
      setIsRunning(false);
    }
  }, []);

  const handleLoginModal = useCallback(() => {
    return new Promise((resolve) => {
      // Wait for modal to appear
      const checkForModal = setInterval(() => {
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) {
          clearInterval(checkForModal);

          modalDriverRef.current = driver({
            ...TOUR_CONFIG.modal,
            onClose: () => {
              resolve();
              const closeBtn = document.querySelector(".modal-close-button");
              if (closeBtn) closeBtn.click();
            },
          });

          modalDriverRef.current.setSteps([
            {
              element: 'input[type="email"]',
              popover: {
                title: "Login Options",
                description:
                  "Enter your email or use social login options below to create an account or sign in.",
                side: "right",
              },
            },
          ]);

          modalDriverRef.current.drive();
          emailInput.focus();
        }
      }, 100);

      // Cleanup check after 5 seconds
      setTimeout(() => {
        clearInterval(checkForModal);
        resolve();
      }, 5000);
    });
  }, []);

  const handleGameCard = useCallback(() => {
    return new Promise((resolve) => {
      // Wait for betting modal to appear
      const checkForBettingModal = setInterval(() => {
        const bettingModal = document.querySelector(".betting-modal");
        if (bettingModal) {
          clearInterval(checkForBettingModal);

          modalDriverRef.current = driver({
            ...TOUR_CONFIG.modal,
            onClose: () => {
              resolve();
              const closeBtn = document.querySelector(
                ".betting-modal .close-button"
              );
              if (closeBtn) closeBtn.click();
            },
          });

          modalDriverRef.current.setSteps([
            {
              element: ".betting-modal",
              popover: {
                title: "Place Your Bet",
                description:
                  "Select your team and enter your bet amount. The potential winnings will update automatically.",
                side: "left",
              },
            },
          ]);

          modalDriverRef.current.drive();
        }
      }, 100);

      // Cleanup check after 5 seconds
      setTimeout(() => {
        clearInterval(checkForBettingModal);
        resolve();
      }, 5000);
    });
  }, []);

  const getTourSteps = useCallback(() => {
    const steps = [
      {
        element: "body",
        popover: {
          title: "Welcome to betVEX",
          description:
            "betVEX is the Community Powered Esports Betting Platform. Let's show you around!",
          position: "center",
        },
      },
    ];

    if (!isLoggedIn) {
      steps.push({
        element: ".login-button",
        popover: {
          title: "Sign Up / Login",
          description: "Create an account or log in to start betting.",
          onNextClick: async () => {
            const loginButton = document.querySelector(".login-button");
            if (loginButton) {
              loginButton.click();
              await handleLoginModal();
            }
            return true;
          },
        },
      });
    }

    steps.push(
      {
        element: ".nav-links",
        popover: {
          title: "Navigation",
          description:
            "Access different sections of betVEX including Betting, Earn, Community, and Leaderboard.",
        },
      },
      {
        element: ".nav-link-deposit",
        popover: {
          title: "Deposit Funds",
          description: "Click here to deposit funds and start betting.",
        },
      }
    );

    const gameCard = document.querySelector(".game-card");
    if (gameCard) {
      steps.push({
        element: ".game-card",
        popover: {
          title: "Select a Match",
          description: "Click on any match to place your bet.",
          onNextClick: async () => {
            gameCard.click();
            await handleGameCard();
            return true;
          },
        },
      });
    }

    return steps;
  }, [isLoggedIn, handleLoginModal, handleGameCard]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!loginCheckedRef.current) {
      try {
        const userInfo = window.localStorage.getItem("userInfo");
        setIsLoggedIn(!!userInfo);
      } catch (e) {
        console.error("Error checking login status:", e);
        setIsLoggedIn(false);
      }
      loginCheckedRef.current = true;
    }

    if (!driverRef.current) {
      driverRef.current = driver({
        ...TOUR_CONFIG.main,
        onHighlightStarted: () => {
          setIsRunning(true);
        },
        onDestroyed: cleanup,
        onReset: cleanup,
        onClose: cleanup,
      });
    }

    return cleanup;
  }, [cleanup]);

  const startTour = useCallback(() => {
    if (!driverRef.current || isRunning) return;

    try {
      cleanup();

      setTimeout(() => {
        const steps = getTourSteps();
        if (steps.length > 0) {
          driverRef.current.setSteps(steps);
          setIsRunning(true);
          driverRef.current.drive();
        }
      }, 100);
    } catch (error) {
      console.error("Error starting tour:", error);
      cleanup();
    }
  }, [isRunning, getTourSteps, cleanup]);

  const stopTour = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    startTour,
    stopTour,
    isRunning,
  };
}
