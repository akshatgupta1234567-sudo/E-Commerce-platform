import { useContext } from "react";
import { StoreContext } from "./store-context";

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}
