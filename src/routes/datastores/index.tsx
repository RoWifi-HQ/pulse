import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Link, useParams, useSearchParams } from "react-router";
import useSWR, { mutate, useSWRConfig } from "swr";
import {
  getJSONType,
  isTauriError,
  toJsonValue,
  toKVJsonValue,
} from "../../utils";
import {
  type DatastoreEntry,
  type TauriError,
  ErrorKind,
  JsonType,
  KVJsonObject,
} from "../../types";
import { DeleteModal } from "./modify";
import { EntryContext } from "./context";
import { useDebouncedCallback } from "use-debounce";
import { toast_queue } from "../../toast";
import { DatastoreEntryData, EntryTypeSelect } from "./entry/components";

async function list_data_entries(
  universe_id: number,
  datastore_id: string,
  page_token?: string,
  filter?: string
) {
  try {
    const entries = await invoke("list_datastore_entries", {
      universe_id,
      datastore_id,
      page_token,
      filter,
    });
    return entries as { data: { id: string }[]; next_page_token?: string };
  } catch (error) {
    return error as TauriError;
  }
}

async function get_datastore_entry(
  universe_id: number,
  datastore_id: string,
  entry_id: string
) {
  try {
    const entry = await invoke("get_datastore_entry", {
      universe_id,
      datastore_id,
      entry_id,
    });
    return entry as DatastoreEntry;
  } catch (error) {
    return error as TauriError;
  }
}

export default function DatastorePage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageToken, setPageToken] = useState<string | undefined>();

  const handleEntryFilter = useDebouncedCallback((term: string) => {
    setSearchParams((params) => {
      if (term) {
        params.set("filter", term);
      } else {
        params.delete("filter");
      }
      return params;
    });
  }, 300);

  return (
    <div className="h-full w-full flex flex-col bg-neutral-900 text-neutral-100">
      <div className="p-6 space-y-6">
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
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Filter by entry ID"
              defaultValue={searchParams.get("filter")?.toString()}
              onChange={(e) => handleEntryFilter(e.target.value)}
            />
          </div>

          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v14m7-7H5"
              />
            </svg>
            New Entry
          </Link>
        </div>
      </div>

      <DatastoreEntries
        page={page}
        setPage={setPage}
        pageToken={pageToken}
        setPageToken={setPageToken}
      />
    </div>
  );
}

function DatastoreEntries({
  page,
  setPage,
  pageToken,
  setPageToken,
}: {
  page: number;
  setPage: (page: number) => void;
  pageToken?: string;
  setPageToken: (pageToken?: string) => void;
}) {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const { data: entries } = useSWR(
    [
      params.universe_id,
      params.datastore_id,
      page,
      searchParams.get("filter")?.toString(),
    ],
    () =>
      list_data_entries(
        Number.parseInt(params.universe_id!),
        params.datastore_id!,
        pageToken,
        searchParams.get("filter")?.toString()
      ),
    {
      revalidateOnFocus: false,
    }
  );

  if (isTauriError(entries)) {
    const errorMessages = {
      [ErrorKind.Forbidden]:
        "Oh No! The token does not have access to this datastore.",
      [ErrorKind.NotFound]: "Oh No! The datastore does not seem to exist.",
      [ErrorKind.RobloxServer]: "Oh No! Something went wrong.",
      [ErrorKind.Unknown]: "Oh No! Something went wrong.",
    };

    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center p-8 bg-neutral-800 rounded-lg shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-yellow-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg font-semibold text-neutral-200">
            {errorMessages[entries.kind]}
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (entries && !isTauriError(entries)) {
      setPageToken(entries.next_page_token);
    }
  }, [entries]);

  return (
    <>
      <ScrollArea.Root className="w-full flex-grow">
        <ScrollArea.Viewport className="w-full h-full">
          {entries && (
            <div className="px-6 pb-6 space-y-4">
              {entries.data.map((entry) => (
                <DatastoreEntryCard
                  key={entry.id}
                  entry_id={entry.id}
                  page={page}
                />
              ))}
            </div>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-neutral-800 transition-colors duration-150 ease-out hover:bg-neutral-700 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-neutral-600 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      <div className="bg-neutral-800 px-6 py-4 flex items-center justify-center border-t border-neutral-700 sticky bottom-0">
        <nav className="flex rounded-md shadow-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-neutral-600 bg-neutral-700 text-sm font-medium text-neutral-200 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Previous
          </button>
          <span className="relative inline-flex items-center px-4 py-2 border-t border-b border-neutral-600 bg-neutral-800 text-sm font-medium text-neutral-200">
            Page {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-neutral-600 bg-neutral-700 text-sm font-medium text-neutral-200 hover:bg-neutral-600 transition-colors"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </nav>
      </div>
    </>
  );
}

function DatastoreEntryCard({
  entry_id,
  page,
}: {
  entry_id: string;
  page: number;
}) {
  const params = useParams();
  const [isExpanded, setExpanded] = useState(false);
  const { mutate } = useSWRConfig();
  const [searchParams] = useSearchParams();

  function onDelete() {
    mutate([
      params.universe_id,
      params.datastore_id,
      page,
      searchParams.get("filter")?.toString(),
    ]);
  }

  return (
    <Disclosure
      className="bg-neutral-800 rounded-xl overflow-hidden shadow-lg w-full border border-neutral-700 transition-all duration-200 hover:border-neutral-600"
      isExpanded={isExpanded}
      onExpandedChange={setExpanded}
    >
      <Heading className="flex items-center gap-x-3 p-4">
        <Button
          slot="trigger"
          className="flex-grow text-left font-medium flex items-center gap-x-3 rounded-lg focus:outline-none group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`size-4 text-neutral-400 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            } group-hover:text-white`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-lg text-neutral-200 group-hover:text-white transition-colors">
            {entry_id}
          </span>
        </Button>
        <div className="flex items-center gap-x-2">
          <Button
            type="submit"
            form={entry_id}
            className="rounded-lg text-blue-400 hover:text-white hover:bg-blue-500 border border-blue-400 h-8 w-8 p-1.5 transition-colors focus:outline-none"
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
          </Button>
          <DeleteModal
            universe_id={parseInt(params.universe_id!)}
            datastore_id={params.datastore_id!}
            entry_id={entry_id}
            on_submit={onDelete}
          />
          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}/entries/${entry_id}`}
            className="rounded-lg border border-neutral-600 flex items-center px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-blue-500"
          >
            View
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-4 ml-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        </div>
      </Heading>
      <DisclosurePanel className="px-4 pb-4 pt-2">
        {isExpanded && <DatastoreEntryCardInner entry_id={entry_id} />}
      </DisclosurePanel>
    </Disclosure>
  );
}

function DatastoreEntryCardInner({ entry_id }: { entry_id: string }) {
  const params = useParams();
  const { data: entry } = useSWR(
    `entries/${entry_id}`,
    () =>
      get_datastore_entry(
        parseInt(params.universe_id!),
        params.datastore_id!,
        entry_id
      ),
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
    }
  );

  return (
    <>{entry && !isTauriError(entry) && <DatastoreEntryForm entry={entry} />}</>
  );
}

function DatastoreEntryForm({ entry }: { entry: DatastoreEntry }) {
  const params = useParams();
  const [entryState, setEntryState] = useState(toKVJsonValue(entry.value));
  const [type, setType] = useState(getJSONType(entry));

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
        value,
        attributes: entry.attributes,
        users: entry.users,
      });
      mutate(`entries/${entry.id}`, new_entry);
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
      className="text-sm font-mono px-2 pb-2 flex flex-col"
    >
      <div className="py-2 flex items-center gap-x-2">
        <span className="font-bold">Data</span>
        <EntryTypeSelect defaultValue={type} onChange={onTypeChange} />
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
                path={[entryField.key]}
                value={entryField.value}
                type={entryField.type}
              />
            ))}
            <div>
              <Button
                onPress={() => addObjectItem()}
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
              </Button>
            </div>
          </>
        ) : (
          <DatastoreEntryData path={[]} value={entryState} type={type} />
        )}
      </EntryContext.Provider>
    </form>
  );
}
