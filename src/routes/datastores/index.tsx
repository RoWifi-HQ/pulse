import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { Link, useParams, useSearchParams } from "react-router";
import useSWR, { mutate } from "swr";
import { isTauriError, toJsonValue, toKVJsonValue } from "../../utils";
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
import { DatastoreEntryData } from "./entry/components";

async function list_data_entries(
  universe_id: number,
  datastore_id: string,
  page: number,
  filter?: string
) {
  try {
    const entries = await invoke("list_datastore_entries", {
      universe_id,
      datastore_id,
      page,
      filter,
    });
    return entries as string[];
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

  const handleEntryFilter = useDebouncedCallback((term: string) => {
    setSearchParams((params) => {
      if (term) {
        params.set("filter", term);
      } else {
        params.delete("filter");
      }
      return params;
    });
  }, 1000);

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
        </div>

        <input
          type="text"
          className="w-full px-3 py-2 text-sm bg-black border border-gray-600 rounded-md focus:outline-hidden hover:border-fuchsia-700"
          placeholder="Filter by entry ID"
          defaultValue={searchParams.get("filter")?.toString()}
          onChange={(e) => {
            handleEntryFilter(e.target.value);
          }}
        />
      </div>
      <DatastoreEntries />
    </div>
  );
}

function DatastoreEntries() {
  const params = useParams();
  const [page, setPage] = useState(1);
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
        parseInt(params.universe_id!),
        params.datastore_id!,
        page,
        searchParams.get("filter")?.toString()
      ),
    {
      revalidateOnFocus: false,
    }
  );

  if (isTauriError(entries)) {
    switch (entries.kind) {
      case ErrorKind.Forbidden:
        return (
          <div className="h-full w-full flex flex-col text-center">
            Oh No! The token does not have access to this datastore.
          </div>
        );
      case ErrorKind.NotFound:
        return (
          <div className="h-full w-full flex flex-col text-center">
            Oh No! The datastore does not seem to exist.
          </div>
        );
      case ErrorKind.RobloxServer:
        return (
          <div className="h-full w-full flex flex-col text-center">
            Oh No! Something went wrong.
          </div>
        );
      default:
        return (
          <div className="h-full w-full flex flex-col text-center">
            Oh No! Something went wrong.
          </div>
        );
    }
  }

  return (
    <>
      <div className="w-full h-full overflow-auto scrollbar">
        {entries && (
          <div className="px-4 flex flex-col gap-y-1">
            {entries.map((entry) => (
              <DatastoreEntryCard entry_id={entry} page={page} />
            ))}
          </div>
        )}
      </div>
      <div className="bg-neutral-800 px-4 py-3 flex items-center justify-center border-t border-gray-700 sm:px-6">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
          <button
            disabled={page == 1}
            onClick={() => setPage(page - 1)}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-500"
          >
            Previous
          </button>
          <span className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium text-gray-300">
            Page {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-500"
          >
            Next
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
    }
  );
  const [isExpanded, setExpanded] = useState(false);

  return (
    <Disclosure
      className="bg-neutral-700 rounded-lg overflow-hidden shadow-lg w-full"
      isExpanded={isExpanded}
      onExpandedChange={setExpanded}
    >
      <Heading className="flex items-center pr-4 gap-x-2">
        <Button
          slot="trigger"
          className="w-full p-4 text-left font-semibold flex gap-x-2 items-center rounded-lg outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`size-4 ${isExpanded && "rotate-90"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          {entry_id}
        </Button>
        <Button
          type="submit"
          form={entry_id}
          className="rounded-xl text-blue-700 hover:text-white hover:bg-blue-500 border border-blue-700 h-8 w-8 p-1 outline-none"
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
          universe_id={params.universe_id!}
          datastore_id={params.datastore_id!}
          page={page}
          entry_id={entry_id}
        />
        <Link
          to={`/universes/${params.universe_id}/datastores/${params.datastore_id}/entries/${entry_id}`}
          className="rounded-lg border border-neutral-100 flex gap-x-2 items-center p-2"
        >
          View
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      </Heading>
      <DisclosurePanel>
        {entry && !isTauriError(entry) && <DatastoreEntryForm entry={entry} />}
      </DisclosurePanel>
    </Disclosure>
  );
}

function DatastoreEntryForm({ entry }: { entry: DatastoreEntry }) {
  const [entryState, setEntryState] = useState(toKVJsonValue(entry.value));

  async function onSubmit() {
    const value = toJsonValue(entryState, JsonType.Object);
    try {
      await invoke("update_datastore_entry", {
        entry_id: entry.id,
        value: JSON.stringify(value),
        attributes: entry.attributes,
        users: entry.users,
      });
      mutate(`entries/${entry.id}`);
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
      className="text-sm font-mono px-2 pb-2"
    >
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
    </form>
  );
}
