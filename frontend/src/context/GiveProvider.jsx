import { useCallback, useMemo, useState } from "react";
import { GiveContext } from "./giveContext";

export default function GiveProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <GiveContext.Provider value={value}>{children}</GiveContext.Provider>;
}
