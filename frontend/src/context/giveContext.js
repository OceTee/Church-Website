import { createContext, useContext } from "react";

export const GiveContext = createContext(null);

export function useGive() {
  const value = useContext(GiveContext);
  if (!value) {
    throw new Error("useGive must be used within a GiveProvider");
  }
  return value;
}
