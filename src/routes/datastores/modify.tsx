import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import {
  DialogTrigger,
  Button,
  ModalOverlay,
  Modal,
  Dialog,
  Heading,
} from "react-aria-components";
import { toast_queue } from "../../toast";
import { TauriError, ErrorKind } from "../../types";

export interface DeleteModalProps {
  universe_id: number;
  datastore_id: string;
  entry_id: string;
  is_disabled?: boolean;
  on_submit?: () => void;
}

export function DeleteModal({
  universe_id,
  datastore_id,
  entry_id,
  is_disabled,
  on_submit,
}: DeleteModalProps) {
  const [isOpen, setOpen] = useState(false);

  async function onSubmit() {
    try {
      await invoke("delete_datastore_entry", {
        universe_id,
        datastore_id,
        entry_id,
      });
      setOpen(false);
      on_submit?.();
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
      <Button
        isDisabled={is_disabled}
        className="rounded-xl text-red-500 hover:text-white hover:bg-red-500 border border-red-500 h-8 w-8 p-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-neutral-500 disabled:text-neutral-500 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
      >
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
          className="max-w-(--breakpoint-lg) max-h-[75%] overflow-y-auto scrollbar bg-neutral-800 outline-hidden p-8 rounded-md"
        >
          <Dialog className="outline-hidden flex flex-col items-center">
            <Heading slot="title" className="font-bold text-2xl">
              Are you sure you want to delete this entry?
            </Heading>
            <form action={onSubmit} className="outline-hidden mt-12 w-full">
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
