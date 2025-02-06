import { createContext, useContext } from "react";
import { JsonValue } from "../../types";

export const EntryContext = createContext<{
  entry: JsonValue;
  setEntry: (newEntry: JsonValue) => void;
}>({
  entry: null,
  setEntry: () => {},
});

export function useEntry() {
  return useContext(EntryContext);
}
