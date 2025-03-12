import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import * as Label from "@radix-ui/react-label";
import { toast_queue } from "../../toast";
import {
  JsonType,
  type TauriError,
  ErrorKind,
  type KVJsonObject,
} from "../../types";
import { toKVJsonValue, toJsonValue } from "../../utils";
import { EntryContext } from "./context";
import { DatastoreEntryData, EntryTypeSelect } from "./entry/components";

export default function DatastoreNewPage() {
  const params = useParams();

  return (
    <div className="h-full w-full flex flex-col bg-neutral-900 text-neutral-100">
      <div className="p-6 border-b border-neutral-800">
        <nav className="flex items-center text-sm text-neutral-400">
          <Link to="/" className="hover:text-neutral-200 transition-colors">
            Universes
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-4 h-4 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>{params.universe_id}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-4 h-4 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}`}
            className="hover:text-neutral-200 transition-colors"
          >
            {params.datastore_id}
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-4 h-4 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-blue-400 font-medium">New Entry</span>
        </nav>
      </div>

      <div className="flex-grow p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-neutral-100">
            Create New Entry
          </h1>
          <EntryForm />
        </div>
      </div>
    </div>
  );
}

function EntryForm() {
  const params = useParams();
  const [entryState, setEntryState] = useState(toKVJsonValue({ field1: "" }));
  const [type, setType] = useState(JsonType.Object);
  const [id, setId] = useState("");
  const navigate = useNavigate();

  function onTypeChange(new_type: JsonType) {
    if (new_type !== type) {
      switch (new_type) {
        case JsonType.Object:
          setEntryState(toKVJsonValue({ field1: "" }));
          setType(JsonType.Object);
          break;
        case JsonType.Array:
          setEntryState(toKVJsonValue([""]));
          setType(JsonType.Array);
          break;
        case JsonType.Number:
          setEntryState(toKVJsonValue(0));
          setType(JsonType.Number);
          break;
        case JsonType.Boolean:
          setEntryState(toKVJsonValue(false));
          setType(JsonType.Boolean);
          break;
        case JsonType.String:
          setEntryState(toKVJsonValue(""));
          setType(JsonType.String);
          break;
        case JsonType.Null:
          setEntryState(toKVJsonValue(null));
          setType(JsonType.Null);
          break;
      }
    }
  }

  function addObjectItem() {
    const currentEntry = entryState as KVJsonObject;
    setEntryState([
      ...currentEntry,
      {
        key:
          type == JsonType.Object
            ? `field${currentEntry.length}`
            : `${currentEntry.length}`,
        value: "",
        type: JsonType.String,
      },
    ]);
  }

  async function onSubmit() {
    const value = toJsonValue(entryState, type);
    try {
      await invoke("create_datastore_entry", {
        universe_id: params.universe_id,
        datastore_id: params.datastore_id,
        entry_id: id,
        value,
        attributes: {},
        users: [],
      });

      toast_queue.add(
        { success: true, description: "Entry Created" },
        { timeout: 5000 }
      );

      navigate(
        `/universes/${params.universe_id}/datastores/${params.datastore_id}`
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
    <form action={onSubmit} className="bg-neutral-800 rounded-lg p-6 shadow-lg">
      <div className="mb-6">
        <div className="flex flex-col gap-2">
          <Label.Root
            htmlFor="entry-id"
            className="text-sm font-medium text-neutral-300"
          >
            Entry ID
          </Label.Root>
          <input
            id="entry-id"
            name="id"
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="bg-neutral-700 border border-neutral-600 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="border-t border-neutral-700 pt-6 mb-6">
        <div className="flex gap-x-6">
          <h2 className="text-lg font-semibold mb-4 text-neutral-200">Data</h2>
          <EntryTypeSelect defaultValue={type} onChange={onTypeChange} />
        </div>
        <div className="bg-neutral-750 rounded-lg p-4">
          <EntryContext.Provider
            value={{
              entry: entryState,
              setEntry: (newEntry) => {
                setEntryState(newEntry);
              },
            }}
          >
            {Array.isArray(entryState) ? (
              <>
                {entryState.map((entryField) => (
                  <DatastoreEntryData
                    key={entryField.key}
                    path={[entryField.key]}
                    value={entryField.value}
                    type={entryField.type}
                  />
                ))}
                <div>
                  <button
                    type="button"
                    onClick={() => addObjectItem()}
                    className="bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center gap-2 text-sm font-medium border border-blue-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 relative z-10"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Add Field
                  </button>
                </div>
              </>
            ) : (
              <DatastoreEntryData path={[]} value={entryState} type={type} />
            )}
          </EntryContext.Provider>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Link
          to={`/universes/${params.universe_id}/datastores/${params.datastore_id}`}
          className="px-6 py-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
        >
          Create Entry
        </button>
      </div>
    </form>
  );
}
