import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import {
  DialogTrigger,
  Button,
  ModalOverlay,
  Modal,
  Dialog,
  Heading,
  Label,
  TextField,
  TextArea,
} from "react-aria-components";
import { useSWRConfig } from "swr";
import { toast_queue } from "../../toast";
import { DatastoreEntry, TauriError, ErrorKind } from "../../types";
import { isJsonMap } from "../../utils";

export interface EditModalProps {
  universe_id: number;
  datastore_id: string;
  page: number;
  entry: DatastoreEntry;
}

export function EditModal({ universe_id, datastore_id, entry, page }: EditModalProps) {
  const [isOpen, setOpen] = useState(false);
  const { mutate } = useSWRConfig();

  async function onSubmit(formData: FormData) {
    const value = Object.fromEntries(
      Array.from(formData.entries())
        .filter((e) => e[0].startsWith("value:"))
        .map(([k, v]) => {
          const key = k.split(":")[1];
          return [key, JSON.parse(v.toString())];
        })
    );
    try {
      await invoke("update_datastore_entry", {
        entry_id: entry.id,
        value: JSON.stringify(value),
        attributes: entry.attributes,
        users: entry.users,
      });
      setOpen(false);
      mutate(
        `universes/${universe_id}/datastores/${datastore_id}/page/${page}`
      );
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
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button className="rounded-xl hover:bg-neutral-700 h-8 w-8 p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
          />
        </svg>
      </Button>
      <ModalOverlay className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50">
        <Modal className="max-w-screen-lg max-h-[75%] overflow-y-auto scrollbar bg-neutral-800 outline-none p-8 rounded-md">
          <Dialog className="outline-none flex flex-col items-center">
            <Heading slot="title" className="font-bold text-2xl">
              Edit Entry
            </Heading>
            <form
              action={onSubmit}
              className="outline-none grid grid-cols-3 gap-x-6 gap-y-8 items-center mt-12 w-full"
            >
              <Label className="font-semibold">Id</Label>
              <span className="col-span-2">{entry.id}</span>
              {isJsonMap(entry.value) &&
                Object.entries(entry.value).map(([k, v]) => (
                  <>
                    <Label className="font-semibold">{k}</Label>
                    <TextField
                      name={`value:${k}`}
                      className="col-span-2 min-w-64"
                      defaultValue={JSON.stringify(v)}
                    >
                      <TextArea className="h-48 w-96 bg-neutral-900 overflow-y-auto scrollbar text-sm p-4 rounded-md" />
                    </TextField>
                  </>
                ))}
              <div className="col-span-3 flex w-full justify-evenly">
                <Button
                  type="button"
                  onPress={() => setOpen(false)}
                  className="px-3 py-2 hover:bg-neutral-700 rounded-md"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-800 rounded-lg"
                >
                  Submit
                </Button>
              </div>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

export interface DeleteModalProps {
  universe_id: number;
  datastore_id: string;
  page: number;
  entry_id: string;
}

export function DeleteModal({
  universe_id,
  datastore_id,
  entry_id,
  page,
}: DeleteModalProps) {
  const [isOpen, setOpen] = useState(false);
  const { mutate } = useSWRConfig();

  async function onSubmit() {
    try {
      await invoke("delete_datastore_entry", {
        page,
        entry_id,
      });
      setOpen(false);
      mutate(
        `universes/${universe_id}/datastores/${datastore_id}/page/${page}`
      );
    } catch (error) {
      const err = error as TauriError;
      let description = "";
      if (err.kind == ErrorKind.Forbidden)
        description = "The token does not have permissions to delete entries.";
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
    <DialogTrigger>
      <Button className="rounded-xl text-red-500 hover:text-white hover:bg-red-500 border border-red-500 h-8 w-8 p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </Button>
      <ModalOverlay className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50">
        <Modal
          isOpen={isOpen}
          onOpenChange={setOpen}
          className="max-w-screen-lg max-h-[75%] overflow-y-auto scrollbar bg-neutral-800 outline-none p-8 rounded-md"
        >
          <Dialog className="outline-none flex flex-col items-center">
            <Heading slot="title" className="font-bold text-2xl">
              Are you sure you want to delete this entry?
            </Heading>
            <form action={onSubmit} className="outline-none mt-12 w-full">
              <div className="flex w-full justify-evenly">
                <Button
                  type="button"
                  onPress={() => setOpen(false)}
                  className="px-3 py-2 hover:bg-neutral-700 rounded-md"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  className="px-3 py-2 bg-red-500 hover:bg-red-700 rounded-lg"
                >
                  Delete
                </Button>
              </div>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
