import { createContext } from "react";

export const StatsContext = createContext({
  latestTotal: 0,
  setLatestTotal: () => {},
});