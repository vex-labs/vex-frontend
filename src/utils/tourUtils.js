import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";

/**
 * Starts the learn tour after ensuring the user is on the root route
 * @param {Function} startTour - The function to start the tour
 * @returns {Function} - A function that will navigate to root if needed and start the tour
 */
export const useStartTourFromRoot = (startTour) => {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(() => {
    if (pathname !== "/") {
      // Navigate to the root route with a query parameter to indicate tour should start
      router.push("/?startTour=true");
    } else {
      // Already on the root route, start the tour immediately
      startTour(true);
    }
  }, [router, pathname, startTour]);
};

/**
 * Hook to check if tour should start after navigation
 * @param {Function} startTour - The function to start the tour
 */
export const useCheckTourStart = (startTour) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined") {
      // Check if we just navigated with the intent to start a tour
      const startTourParam = searchParams.get("startTour");
      if (startTourParam === "true") {
        // Clean up the URL by removing the query parameter
        const url = new URL(window.location.href);
        url.searchParams.delete("startTour");

        // Replace the current URL without the query parameter
        router.replace(url.pathname + url.search);

        // Start the tour
        startTour(true);
      }
    }
  }, [router, searchParams, startTour]);
};
