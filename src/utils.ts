import { JsonValue, JsonMap, TauriError, JsonType } from "./types";

export function isJsonValue(value: unknown): value is JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

export function isJsonMap(value: unknown): value is JsonMap {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isJsonValue)
  );
}

export function isTauriError<T>(value: T | TauriError): value is TauriError {
    return (value as TauriError)?.kind !== undefined;
}

export function getJSONType(value: JsonValue): JsonType {
  if (isJsonMap(value)) {
    return JsonType.Object;
  } else if (Array.isArray(value)) {
    return JsonType.Array;
  } else if (typeof value === "number") {
    return JsonType.Number;
  } else if (typeof value === "string") {
    return JsonType.String;
  } else if (typeof value === "boolean") {
    return JsonType.Boolean;
  } else {
    return JsonType.Null;
  }
}
