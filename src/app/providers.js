"use client";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Web3AuthProvider } from "@/app/context/Web3AuthContext";
import { NearProvider } from "./context/NearContext";
import { GlobalProvider } from "./context/GlobalContext";
import { TourProvider } from "@reactour/tour";
import { steps } from "./tour/steps";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }) {
  const queryClient = getQueryClient();
  return (
    <Web3AuthProvider>
      <NearProvider>
        <GlobalProvider>
          <QueryClientProvider client={queryClient}>
            <TourProvider
              steps={steps}
              disableDotsNavigation={true}
              showPrevNextButtons={false}
              showCloseButton={false}
            >
              {children}
            </TourProvider>
          </QueryClientProvider>
        </GlobalProvider>
      </NearProvider>
    </Web3AuthProvider>
  );
}
