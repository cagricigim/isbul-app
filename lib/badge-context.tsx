import React, { createContext, useContext, useState } from "react";

type SuppressedCategory = "none" | "messages" | "offers";

type BadgeFocusContextValue = {
  suppressedCategory: SuppressedCategory;
  setSuppressedCategory: (cat: SuppressedCategory) => void;
};

const BadgeFocusContext = createContext<BadgeFocusContextValue>({
  suppressedCategory: "none",
  setSuppressedCategory: () => {},
});

export function BadgeFocusProvider({ children }: { children: React.ReactNode }) {
  const [suppressedCategory, setSuppressedCategory] =
    useState<SuppressedCategory>("none");

  return (
    <BadgeFocusContext.Provider value={{ suppressedCategory, setSuppressedCategory }}>
      {children}
    </BadgeFocusContext.Provider>
  );
}

export function useBadgeFocus() {
  return useContext(BadgeFocusContext);
}
