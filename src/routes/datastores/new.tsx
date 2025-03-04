import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useParams, Link } from "react-router";
import { toast_queue } from "../../toast";
import { JsonType, TauriError, ErrorKind, KVJsonObject } from "../../types";
import { toKVJsonValue, toJsonValue } from "../../utils";
import { EntryContext } from "./context";
import { DatastoreEntryData } from "./entry/components";
import { TextField, Label, Input, Button } from "react-aria-components";

export default function DatastoreNewPage() {
  const params = useParams();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 flex gap-x-4">
        <div className="flex items-center gap-x-1 text-neutral-300 text-sm">
          <Link to="/" className="hover:text-neutral-500">
            Universes
          </Link>
          <span>{">"}</span>
          <span>{params.universe_id}</span>
          <span>{">"}</span>
          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}`}
            className="hover:text-neutral-500"
          >
            {params.datastore_id}
          </Link>
          <span>{">"}</span>
          <span>{"New Entry"}</span>
        </div>
      </div>

      <EntryForm />
    </div>
  );
}

function EntryForm() {
  const [entryState, setEntryState] = useState(toKVJsonValue({ field1: "" }));
  const [id, setId] = useState("");

  async function onSubmit() {
    const value = toJsonValue(entryState, JsonType.Object);
    try {
      await invoke("update_datastore_entry", {
        entry_id: id,
        value,
        attributes: {},
        users: [],
      });

      toast_queue.add(
        { success: true, description: "Entry Created" },
        { timeout: 5000 }
      );
    } catch (error) {
      const err = error as TauriError;
      let description = "";
      if (err.kind == ErrorKind.Forbidden)
        description = "The token does not have permissions to create entries.";
      else description = "Something went wrong.";
      toast_queue.add(
        { success: false, description: description },
        { timeout: 5000 }
      );
    }
  }

  return (
    <form action={onSubmit} className="text-sm font-mono px-2 pb-2">
      <TextField
        name="id"
        isRequired
        value={id}
        onChange={setId}
        className="flex gap-x-6 items-center"
      >
        <Label className="font-semibold">Entry ID</Label>
        <Input className="bg-neutral-700 p-2 rounded-lg" />
      </TextField>
      <EntryContext.Provider
        value={{
          entry: entryState,
          setEntry: (newEntry) => {
            setEntryState(newEntry);
          },
        }}
      >
        {(entryState as KVJsonObject).map((entry) => (
          <DatastoreEntryData
            key_={[entry.key]}
            value={entry.value}
            type={entry.type}
          />
        ))}
      </EntryContext.Provider>
      <Button
        type="submit"
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
      >
        Create
      </Button>
    </form>
  );
}
