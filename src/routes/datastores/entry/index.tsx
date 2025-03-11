import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import useSWR, { mutate } from "swr";
import * as Select from "@radix-ui/react-select";
import { toast_queue } from "../../../toast";
import {
  type DatastoreEntry,
  JsonType,
  type TauriError,
  ErrorKind,
  type KVJsonObject,
} from "../../../types";
import {
  toKVJsonValue,
  toJsonValue,
  isTauriError,
  getJSONType,
} from "../../../utils";
import { EntryContext } from "../context";
import { DatastoreEntryData, EntryTypeSelect } from "./components";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { DeleteModal } from "../modify";

async function get_datastore_entry(
  universe_id: number,
  datastore_id: string,
  entry_id: string,
  revision_id: string
) {
  try {
    const entry = await invoke("get_datastore_entry", {
      universe_id,
      datastore_id,
      entry_id,
      revision_id,
    });
    return entry as DatastoreEntry;
  } catch (error) {
    return error as TauriError;
  }
}

async function list_datastore_entry_revisions(
  universe_id: number,
  datastore_id: string,
  entry_id: string,
  page_token?: string
) {
  try {
    const revisions = await invoke("list_datastore_entry_revisions", {
      universe_id,
      datastore_id,
      entry_id,
      page_token,
    });
    return revisions as {
      data: { revisionId: string }[];
      next_page_token?: string;
    };
  } catch (error) {
    return error as TauriError;
  }
}

export default function DatastoreEntryPage() {
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
          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}/entries/${params.entry_id}`}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            {params.entry_id}
          </Link>
        </nav>
      </div>

      <DatastoreEntryCard entry_id={params.entry_id!} />
    </div>
  );
}

function DatastoreEntryCard({ entry_id }: { entry_id: string }) {
  const params = useParams();
  const [revision, setRevision] = useState("latest");
  const { data: entry } = useSWR(
    `entries/${entry_id}/revisions/${revision}`,
    () =>
      get_datastore_entry(
        parseInt(params.universe_id!),
        params.datastore_id!,
        entry_id,
        revision
      ),
    {
      revalidateOnFocus: false,
    }
  );
  const { data: revisions } = useSWR(
    `entries/${entry_id}/revisions`,
    () =>
      list_datastore_entry_revisions(
        parseInt(params.universe_id!),
        params.datastore_id!,
        entry_id
      ),
    {
      revalidateOnFocus: false,
    }
  );
  const navigate = useNavigate();

  return (
    <ScrollArea.Root className="w-full flex-grow">
      <ScrollArea.Viewport className="w-full h-full">
        <div className="flex w-full items-center justify-end px-6 py-4 border-b border-neutral-800">
          {!isTauriError(revisions) && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-400">Revision:</span>
              <Select.Root value={revision} onValueChange={setRevision}>
                <Select.Trigger className="w-64 h-9 rounded-lg border border-neutral-700 bg-neutral-800 px-3 flex items-center justify-between text-neutral-200 hover:border-neutral-600 transition-colors overflow-hidden">
                  <Select.Value placeholder="latest" />
                  <Select.Icon>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="w-4 h-4 ml-2 text-neutral-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden z-50 border border-neutral-700 bg-neutral-800 shadow-lg rounded-lg">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="latest"
                        className="px-3 py-2 text-neutral-200 outline-none data-[highlighted]:bg-neutral-700 data-[highlighted]:text-white rounded-md transition-colors duration-200 cursor-pointer flex items-center"
                      >
                        <Select.ItemText>Latest</Select.ItemText>
                        <Select.ItemIndicator className="absolute right-2">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </Select.ItemIndicator>
                      </Select.Item>
                      {(revisions?.data ?? []).map((r) => (
                        <Select.Item
                          key={r.revisionId}
                          value={r.revisionId}
                          className="px-3 py-2 text-neutral-200 outline-none data-[highlighted]:bg-neutral-700 data-[highlighted]:text-white rounded-md transition-colors duration-200 cursor-pointer flex items-center"
                        >
                          <Select.ItemText>{r.revisionId}</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-2">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          )}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => mutate(`entries/${entry_id}/revision/${revision}`)}
              className="rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-400 border border-neutral-400 h-8 w-8 p-1.5 transition-colors focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
            <button
              type="submit"
              disabled={revision !== "latest"}
              form={entry_id}
              className="rounded-lg text-blue-400 hover:text-white hover:bg-blue-500 border border-blue-400 h-9 w-9 p-1.5 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:border-neutral-500 disabled:text-neutral-500 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path
                  d="M6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V9.82843C19.25 9.29799 19.0393 8.78929 18.6642 8.41421L15.5858 5.33579C15.2107 4.96071 14.702 4.75 14.1716 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M8.75 19V15.75C8.75 15.1977 9.19772 14.75 9.75 14.75H14.25C14.8023 14.75 15.25 15.1977 15.25 15.75V19"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M8.75 5V8.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
            <DeleteModal
              universe_id={Number.parseInt(params.universe_id!)}
              datastore_id={params.datastore_id!}
              entry_id={entry_id}
              is_disabled={revision !== "latest"}
              on_submit={() => {
                navigate(
                  `/universes/${params.universe_id}/datastores/${params.datastore_id}`
                );
              }}
            />
          </div>
        </div>
        <div className="flex-grow overflow-auto p-6">
          {entry && !isTauriError(entry) ? (
            <DatastoreEntryForm entry={entry} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-neutral-700 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-700 rounded"></div>
                    <div className="h-4 bg-neutral-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className="flex select-none touch-none p-0.5 bg-neutral-800 transition-colors duration-150 ease-out hover:bg-neutral-700 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
        orientation="vertical"
      >
        <ScrollArea.Thumb className="flex-1 bg-neutral-600 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

function DatastoreEntryForm({ entry }: { entry: DatastoreEntry }) {
  const [entryState, setEntryState] = useState(toKVJsonValue(entry.value));
  const [type, setType] = useState(getJSONType(entry));
  const params = useParams();

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
          setType(JsonType.Number);
          break;
        case JsonType.String:
          setEntryState(toKVJsonValue(""));
          setType(JsonType.String);
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
    const value = toJsonValue(entryState, JsonType.Object);
    try {
      const new_entry = await invoke("update_datastore_entry", {
        universe_id: params.universe_id,
        datastore_id: params.datastore_id,
        entry_id: entry.id,
        value: JSON.stringify(value),
        attributes: entry.attributes,
        users: entry.users,
      });
      mutate(`entries/${entry.id}`, new_entry);
      mutate(`entries/${entry.id}/revisions`);
      toast_queue.add(
        { success: true, description: "Entry Modified" },
        { timeout: 5000 }
      );
    } catch (error) {
      const err = error as TauriError;
      let description = "";
      if (err.kind == ErrorKind.Forbidden)
        description = "The token does not have permissions to update entries.";
      else if (err.kind == ErrorKind.NotFound)
        description = "The entry was not found. The data may be outdated.";
      else description = "Something went wrong.";
      toast_queue.add(
        { success: false, description: description },
        { timeout: 5000 }
      );
    }
  }

  return (
    <form
      id={entry.id}
      action={onSubmit}
      className="text-sm font-mono bg-neutral-800 rounded-lg p-6 shadow-lg"
    >
      <div className="py-2 flex items-center gap-x-2">
        <span className="font-bold">Data</span>
        <EntryTypeSelect defaultValue={type} onChange={onTypeChange} />
        <button
          type="button"
          onClick={() => setEntryState(toKVJsonValue(entry.value))}
          className="bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center gap-2 text-sm font-medium border border-blue-500/20"
        >
          Reset
        </button>
      </div>
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
    </form>
  );
}
