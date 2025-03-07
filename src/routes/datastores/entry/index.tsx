import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Link, useParams } from "react-router";
import useSWR, { mutate } from "swr";
import { toast_queue } from "../../../toast";
import {
  DatastoreEntry,
  JsonType,
  TauriError,
  ErrorKind,
  KVJsonObject,
} from "../../../types";
import { toKVJsonValue, toJsonValue, isTauriError } from "../../../utils";
import { EntryContext } from "../context";
import { DatastoreEntryData } from "./components";
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { DeleteModal } from "../modify";

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

async function list_datastore_entry_revisions(
  universe_id: number,
  datastore_id: string,
  entry_id: string,
  page: number
) {
  try {
    const revisions = await invoke("list_datastore_entry_revisions", {
      universe_id,
      datastore_id,
      entry_id,
      page,
    });
    return revisions as string[];
  } catch (error) {
    return error as TauriError;
  }
}

export default function DatastoreEntryPage() {
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
          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}/entries/${params.entry_id}`}
            className="hover:text-neutral-500"
          >
            {params.entry_id}
          </Link>
        </div>
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
        entry_id
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
        entry_id,
        1
      ),
    {
      revalidateOnFocus: false,
    }
  );

  return (
    <>
      <div className="flex w-full items-center px-2">
        {!isTauriError(revisions) && (
          <Select
            selectedKey={revision}
            onSelectionChange={(k) => setRevision(k as string)}
            aria-label="revision"
            placeholder="latest"
            className="ml-auto"
          >
            <Button className="w-64 h-8 rounded-lg border border-neutral-200">
              <SelectValue />
            </Button>
            <Popover className="w-(--trigger-width)">
              <ListBox className="list-none flex flex-col max-h-40 rounded-lg overflow-auto z-50 border border-solid border-[#4f5254] bg-[#313335]">
                {(revisions ?? []).map((r) => {
                  return (
                    <ListBoxItem className="p-2 text-center outline-none focus:bg-neutral-700 transition-colors duration-200" key={r} id={r}>
                      {r}
                    </ListBoxItem>
                  );
                })}
              </ListBox>
            </Popover>
          </Select>
        )}
        <Button
          type="submit"
          form={entry_id}
          className="rounded-xl text-blue-700 hover:text-white hover:bg-blue-500 border border-blue-700 h-8 w-8 p-1 mr-4 outline-none"
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
          entry_id={entry_id}
          page={1}
        />
      </div>
      {entry && !isTauriError(entry) && <DatastoreEntryForm entry={entry} />}
    </>
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
