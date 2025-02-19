import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { Link, useParams, useSearchParams } from "react-router";
import useSWR from "swr";
import { getJSONType, isTauriError, toKVJsonValue } from "../../utils";
import {
  type DatastoreEntry,
  type TauriError,
  ErrorKind,
  JsonType,
  KVJsonObject,
  KVJsonValue,
} from "../../types";
import { DeleteModal } from "./modify";
import { EntryContext, useEntry } from "./context";
import { useDebouncedCallback } from "use-debounce";

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
      filter
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
    [params.universe_id, params.datastore_id, page, searchParams.get("filter")?.toString()],
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
      <Heading className="flex items-center pr-4">
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
        <DeleteModal
          universe_id={parseInt(params.universe_id!)}
          datastore_id={params.datastore_id!}
          page={page}
          entry_id={entry_id}
        />
      </Heading>
      <DisclosurePanel>
        {entry && !isTauriError(entry) && <DatastoreEntryForm entry={entry} />}
      </DisclosurePanel>
    </Disclosure>
  );
}

function DatastoreEntryForm({ entry }: { entry: DatastoreEntry }) {
  const [entryState, setEntryState] = useState(toKVJsonValue(entry.value));
  console.log(entryState);

  async function onSubmit(formData: FormData) {
    console.log(formData.entries());
  }

  return (
    <form action={onSubmit} className="text-sm font-mono px-2 pb-2">
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

function DatastoreEntryData({
  key_,
  value,
  type,
}: {
  key_: string[];
  value: KVJsonValue;
  type: JsonType;
}) {
  switch (type) {
    case JsonType.Object: {
      return (
        <DatastoreEntryDataMap key_={key_} value={value as KVJsonObject} />
      );
    }
    case JsonType.Array: {
      return (
        <DatastoreEntryDataArray key_={key_} value={value as KVJsonObject} />
      );
    }
    default: {
      return <DatastoreEntryDataPrimitive key_={key_} value={value as any} />;
    }
  }
}

function DatastoreEntryDataMap({
  key_,
  value,
}: {
  key_: any[];
  value: KVJsonObject;
}) {
  const [isExpanded, setExpanded] = useState(false);
  const { entry, setEntry } = useEntry();

  function addObjectItem() {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    current.push({
      key: `field${current.length}`,
      value: "",
      type: JsonType.String,
    });
    setEntry(updatedEntry);
  }

  function removeCurrent() {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
    current.splice(index, 1);
    setEntry(updatedEntry);
  }

  function onTypeChange(new_type: JsonType) {
    const updatedEntry = structuredClone(entry);
    if (new_type !== getJSONType(value)) {
      let current = updatedEntry as KVJsonObject;
      for (let i = 0; i < key_.length - 1; i++) {
        // @ts-ignore
        current = current.find((v) => v.key == key_[i])?.value;
      }

      // @ts-ignore
      const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
      switch (new_type) {
        case JsonType.Array: {
          // @ts-ignore
          current[index].value = [];
          current[index].type = JsonType.Array;
          break;
        }
        case JsonType.Object: {
          // @ts-ignore
          current[index].value = [];
          current[index].type = JsonType.Object;
          break;
        }
        case JsonType.Number: {
          // @ts-ignore
          current[index].value = 0;
          current[index].type = JsonType.Number;
          break;
        }
        case JsonType.String: {
          // @ts-ignore
          current[index].value = "";
          current[index].type = JsonType.String;
          break;
        }
        case JsonType.Boolean: {
          // @ts-ignore
          current[index].value = false;
          current[index].type = JsonType.Boolean;
          break;
        }
      }
      setEntry(updatedEntry);
    }
  }

  function onKeyChange(new_key: string) {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    // @ts-ignore
    const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
    current[index].key = new_key;
    setEntry(updatedEntry);
  }

  return (
    <Disclosure isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <Heading className="flex items-center gap-x-2">
        <Button slot="trigger">
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
        </Button>
        <input
          type="text"
          className="bg-neutral-700 focus:outline focus:bg-neutral-800 rounded-lg focus:outline-white w-24"
          value={key_[key_.length - 1]}
          onChange={(e) => onKeyChange(e.target.value)}
        />
        <DatastoreEntryDataTypeSelect
          defaultValue={JsonType.Object}
          onChange={onTypeChange}
        />
        <Button className="text-neutral-400" onPress={() => addObjectItem()}>
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
              d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </Button>
        <Button onPress={() => removeCurrent()} className="flex items-center">
          <span className="size-4 rounded-full text-red-600 border border-red-600 flex items-center">
            <div className="w-full h-[2px] bg-red-600 m-1" />
          </span>
        </Button>
      </Heading>
      <DisclosurePanel className="px-2">
        {value.map((entry) => (
          <DatastoreEntryData
            key_={[...key_, entry.key]}
            value={entry.value}
            type={entry.type}
          />
        ))}
      </DisclosurePanel>
    </Disclosure>
  );
}

function DatastoreEntryDataArray({
  key_,
  value,
}: {
  key_: any[];
  value: KVJsonObject;
}) {
  const [isExpanded, setExpanded] = useState(false);
  const { entry, setEntry } = useEntry();

  function addArrayItem() {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    current.push({
      key: current.length.toString(),
      value: "",
      type: JsonType.String,
    });
    setEntry(updatedEntry);
  }

  function removeCurrent() {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
    current.splice(index, 1);
    setEntry(updatedEntry);
  }

  function onTypeChange(new_type: JsonType) {
    const updatedEntry = structuredClone(entry);
    if (new_type !== getJSONType(value)) {
      let current = updatedEntry as KVJsonObject;
      for (let i = 0; i < key_.length - 1; i++) {
        // @ts-ignore
        current = current.find((v) => v.key == key_[i])?.value;
      }

      // @ts-ignore
      const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
      switch (new_type) {
        case JsonType.Array: {
          // @ts-ignore
          current[index].value = [];
          current[index].type = JsonType.Array;
          break;
        }
        case JsonType.Object: {
          // @ts-ignore
          current[index].value = [];
          current[index].type = JsonType.Object;
          break;
        }
        case JsonType.Number: {
          // @ts-ignore
          current[index].value = 0;
          current[index].type = JsonType.Number;
          break;
        }
        case JsonType.String: {
          // @ts-ignore
          current[index].value = "";
          current[index].type = JsonType.String;
          break;
        }
        case JsonType.Boolean: {
          // @ts-ignore
          current[index].value = false;
          current[index].type = JsonType.Boolean;
          break;
        }
      }
      setEntry(updatedEntry);
    }
  }

  function onKeyChange(new_key: string) {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    // @ts-ignore
    const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
    current[index].key = new_key;
    setEntry(updatedEntry);
  }

  return (
    <Disclosure isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <Heading className="flex items-center gap-x-2">
        <Button slot="trigger">
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
        </Button>
        <input
          type="text"
          className="bg-neutral-700 focus:outline focus:bg-neutral-800 rounded-lg focus:outline-white w-24"
          value={key_[key_.length - 1]}
          onChange={(e) => onKeyChange(e.target.value)}
        />
        <DatastoreEntryDataTypeSelect
          defaultValue={JsonType.Array}
          onChange={onTypeChange}
        />
        <Button className="text-neutral-400" onPress={() => addArrayItem()}>
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
              d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </Button>
        <Button onPress={() => removeCurrent()} className="flex items-center">
          <span className="size-4 rounded-full text-red-600 border border-red-600 flex items-center">
            <div className="w-full h-[2px] bg-red-600 m-1" />
          </span>
        </Button>
      </Heading>
      <DisclosurePanel className="px-2">
        {value.map((v) => (
          <DatastoreEntryData
            key_={[...key_, v.key]}
            value={v.value}
            type={v.type}
          />
        ))}
      </DisclosurePanel>
    </Disclosure>
  );
}

function DatastoreEntryDataPrimitive({
  key_,
  value,
}: {
  key_: string[];
  value: string | boolean | number | null;
}) {
  const [isFocused, setFocused] = useState(false);
  const { entry, setEntry } = useEntry();

  function onValueChange(new_value: any) {
    if (typeof value === "number") {
      new_value = parseInt(new_value);
    }
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
    current[index].value = new_value;
    setEntry(updatedEntry);
  }

  function onKeyChange(new_key: string) {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    // @ts-ignore
    const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
    current[index].key = new_key;
    setEntry(updatedEntry);
  }

  function removeCurrent() {
    const updatedEntry = structuredClone(entry);

    let current = updatedEntry as KVJsonObject;
    for (let i = 0; i < key_.length - 1; i++) {
      // @ts-ignore
      current = current.find((v) => v.key == key_[i])?.value;
    }

    // @ts-ignore
    const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
    current.splice(index, 1);
    setEntry(updatedEntry);
  }

  function onTypeChange(new_type: JsonType) {
    const updatedEntry = structuredClone(entry);
    if (new_type !== getJSONType(value)) {
      let current = updatedEntry as KVJsonObject;
      for (let i = 0; i < key_.length - 1; i++) {
        // @ts-ignore
        current = current.find((v) => v.key == key_[i])?.value;
      }

      // @ts-ignore
      const index = current.findIndex((v) => v.key == key_[key_.length - 1]);
      switch (new_type) {
        case JsonType.Array: {
          // @ts-ignore
          current[index].value = [];
          current[index].type = JsonType.Array;
          break;
        }
        case JsonType.Object: {
          // @ts-ignore
          current[index].value = [];
          current[index].type = JsonType.Object;
          break;
        }
        case JsonType.Number: {
          // @ts-ignore
          current[index].value = 0;
          current[index].type = JsonType.Number;
          break;
        }
        case JsonType.String: {
          // @ts-ignore
          current[index].value = "";
          current[index].type = JsonType.String;
          break;
        }
        case JsonType.Boolean: {
          // @ts-ignore
          current[index].value = false;
          current[index].type = JsonType.Boolean;
          break;
        }
      }
      setEntry(updatedEntry);
    }
  }

  return (
    <div
      className="flex items-center gap-x-2 max-w-max"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      tabIndex={-1}
    >
      <input
        type="text"
        className="bg-neutral-700 focus:outline focus:bg-neutral-800 rounded-lg focus:outline-white w-24"
        value={key_[key_.length - 1]}
        onChange={(e) => onKeyChange(e.target.value)}
      />
      :
      <input
        type={typeof value === "number" ? "number" : "text"}
        value={value?.toString()}
        onChange={(e) => onValueChange(e.target.value)}
        className="bg-neutral-700 focus:outline focus:bg-neutral-800 rounded-lg focus:outline-white py-[1px] w-16"
        onFocus={() => setFocused(true)}
      />
      {isFocused && (
        <DatastoreEntryDataTypeSelect
          defaultValue={getJSONType(value)}
          onChange={onTypeChange}
        />
      )}
      <Button onPress={() => removeCurrent()} className="flex items-center">
        <span className="size-4 rounded-full text-red-600 border border-red-600 flex items-center">
          <div className="w-full h-[2px] bg-red-600 m-1" />
        </span>
      </Button>
    </div>
  );
}

function DatastoreEntryDataTypeSelect({
  defaultValue,
  onChange,
}: {
  defaultValue: JsonType;
  onChange?: (t: JsonType) => void;
}) {
  return (
    <Select
      aria-label="Select"
      selectedKey={defaultValue}
      onSelectionChange={(k) => onChange?.(k as JsonType)}
    >
      <Button className="bg-neutral-600 rounded-lg">
        type: <SelectValue />
      </Button>

      <Popover className="w-[--trigger-width]">
        <ListBox className="list-none max-h-40 rounded-lg overflow-auto z-50 border border-solid border-[#4f5254] bg-[#313335]">
          <ListBoxItem id={JsonType.Array}>{JsonType.Array}</ListBoxItem>
          <ListBoxItem id={JsonType.Object}>{JsonType.Object}</ListBoxItem>
          <ListBoxItem id={JsonType.Number}>{JsonType.Number}</ListBoxItem>
          <ListBoxItem id={JsonType.Boolean}>{JsonType.Boolean}</ListBoxItem>
          <ListBoxItem id={JsonType.String}>{JsonType.String}</ListBoxItem>
        </ListBox>
      </Popover>
    </Select>
  );
}
