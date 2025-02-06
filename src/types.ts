export type StoredUniverse = {
  id: number;
  name: string;
};

export type Datastore = {
  id: string;
};

export enum JsonType {
  Number = "number",
  String = "string",
  Boolean = "boolean",
  Null = "null",
  Object = "object",
  Array = "array"
}

export type JsonMap = { [key: string]: JsonValue };

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonMap;

export enum DatastoreEntryState {
  Unspecified = "STATE_UNSPECIFIED",
  Active = "ACTIVE",
  Deleted = "DELETED",
}

export type DatastoreEntry = {
  createTime: string;
  revisionId: string;
  revisionCreateTime: string;
  state: DatastoreEntryState;
  etag: string;
  value: JsonValue;
  id: string;
  users: string[];
  attributes: any;
};

export type TauriError = {
  kind: ErrorKind;
};

export enum ErrorKind {
  NotFound,
  Forbidden,
  RobloxServer,
  Unknown,
}
