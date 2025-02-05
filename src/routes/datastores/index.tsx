import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { useParams } from "react-router";
import useSWR from "swr";
import { isJsonMap, isTauriError } from "../../utils";
import {
  type DatastoreEntry,
  type TauriError,
  ErrorKind,
  JsonMap,
  JsonValue,
} from "../../types";

async function list_data_entries(
  universe_id: number,
  datastore_id: string,
  page: number
) {
  try {
    const entries = await invoke("list_datastore_entries", {
      universe_id,
      datastore_id,
      page,
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
  const [page, setPage] = useState(1);

  const { data: entries } = useSWR(
    `universes/${params.universe_id!}/datastores/${params.datastore_id!}/page/${page}`,
    () =>
      list_data_entries(
        parseInt(params.universe_id!),
        params.datastore_id!,
        page
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
          <>
            {entries.map((entry) => (
              <DatastoreEntryCard entry_id={entry} />
            ))}
          </>
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

function DatastoreEntryCard({ entry_id }: { entry_id: string }) {
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
      <Heading>
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
      </Heading>
      <DisclosurePanel>
        <div className="text-sm font-mono px-2 pb-2">
          {entry && !isTauriError(entry) && (
            <DatastoreEntryData value={entry.value} />
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

function DatastoreEntryData({
  key_,
  value,
}: {
  key_?: string;
  value: JsonValue;
}) {
  if (isJsonMap(value)) {
    return (
      <>
        {key_ !== undefined ? (
          <DatastoreEntryDataMap key_={key_} value={value} />
        ) : (
          <>
            {Object.entries(value).map(([k, v]) => (
              <DatastoreEntryData key_={k} value={v} />
            ))}
          </>
        )}
      </>
    );
  } else if (Array.isArray(value)) {
    return <DatastoreEntryDataArray key_={key_} value={value} />;
  } else {
    return <p>{`${key_ ?? ""}: ${value?.toString()}`}</p>;
  }
}

function DatastoreEntryDataMap({
  key_,
  value,
}: {
  key_: string;
  value: JsonMap;
}) {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <Disclosure isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <Heading>
        <Button slot="trigger" className="flex items-center gap-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`size-3 ${isExpanded && "rotate-90"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          {`${key_}: Object`}
        </Button>
      </Heading>
      <DisclosurePanel className="px-2">
        {Object.entries(value).map(([k, v]) => (
          <DatastoreEntryData key_={k} value={v} />
        ))}
      </DisclosurePanel>
    </Disclosure>
  );
}

function DatastoreEntryDataArray({
  key_,
  value,
}: {
  key_?: string;
  value: JsonValue[];
}) {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <Disclosure isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <Heading>
        <Button slot="trigger" className="flex items-center gap-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`size-3 ${isExpanded && "rotate-90"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          {`${key_}: array`}
        </Button>
      </Heading>
      <DisclosurePanel className="px-2">
        {value.map((v, i) => (
          <DatastoreEntryData key_={i.toString()} value={v} />
        ))}
      </DisclosurePanel>
    </Disclosure>
  );
}
