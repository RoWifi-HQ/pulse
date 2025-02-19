import { createContext, useContext } from "react";
import { KVJsonValue } from "../../types";

export const EntryContext = createContext<{
  entry: KVJsonValue;
  setEntry: (newEntry: KVJsonValue) => void;
}>({
  entry: null,
  setEntry: () => {},
});

export function useEntry() {
  return useContext(EntryContext);
}