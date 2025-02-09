import { createContext, useContext } from "react";

export const NearContext = createContext();

export function useNear() {
  return useContext(NearContext);
}
