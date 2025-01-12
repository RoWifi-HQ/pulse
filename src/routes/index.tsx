import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
} from "react-aria-components";
import { Link } from "react-router";
import useSWR, { useSWRConfig } from "swr";
import type { StoredUniverse, Datastore } from "../types";

type InitInfo = {
  token: boolean;
};

async function getInitInfo() {
  const res = await invoke("get_init_info");
  return res as InitInfo;
}

async function getUniverses() {
  const res = await invoke("get_universes");
  return res as StoredUniverse[];
}

async function list_datastores(universe_id: number) {
  const res = await invoke("list_datastores", { universe_id });
  return res as Datastore[];
}

export default function Page() {
  const { data: init_info } = useSWR("init", () => getInitInfo());

  return (
    <div className="flex flex-col justify-center max-w-4xl mx-auto">
      <TokenSection token={init_info?.token} />
      <UniverseSection />
    </div>
  );
}

function TokenSection({ token }: { token?: boolean }) {
  const [formOpen, setFormOpen] = useState(false);

  async function onSubmit(formData: FormData) {
    const new_token = formData.get("token")?.toString();
    await invoke("set_token", {
      token: new_token,
    });
    setFormOpen(false);
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4">API Token</h2>
      <div className="flex items-center space-x-4 bg-neutral-700 p-4 rounded-lg">
        {formOpen ? (
          <>
            <form
              action={onSubmit}
              className="flex w-full items-center h-full gap-x-2"
            >
              <TextField
                aria-label="API Token"
                name="token"
                isRequired
                className="w-full h-max"
              >
                <Input className="w-full h-full bg-neutral-700" />
              </TextField>
              <Button
                onPress={() => setFormOpen(false)}
                className="bg-neutral-700 hover:bg-neutral-800 px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
              >
                Save
              </Button>
            </form>
          </>
        ) : (
          <>
            <span className="flex-grow font-mono">
              {token ? "••••••••••••" : "No token set"}
            </span>
            <Button
              onPress={() => setFormOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
            >
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                />
              </svg>

              <span>Edit</span>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function UniverseSection() {
  const { data: universes } = useSWR("universes", () => getUniverses());

  return (
    <section className="flex flex-col items-center mt-12 gap-y-6">
      <div className="flex justify-between items-center mb-6 w-full">
        <h2 className="text-2xl font-bold">Universes</h2>
        <AddUniverse />
      </div>
      <div className="flex flex-col w-full">
        {universes?.map((universe) => (
          <UniverseCard key={universe.id} universe={universe} />
        ))}
      </div>
    </section>
  );
}

function UniverseCard({ universe }: { universe: StoredUniverse }) {
  const { data: datastores } = useSWR(`universes/${universe.id}`, () =>
    list_datastores(universe.id)
  );

  return (
    <Disclosure className="bg-neutral-700 rounded-lg overflow-hidden shadow-lg w-full">
      <Heading>
        <Button
          slot="trigger"
          className="w-full p-4 text-left font-semibold flex justify-between items-center hover:bg-neutral-600 transition-colors duration-200 rounded-lg outline-none"
        >
          {universe.name}
        </Button>
      </Heading>
      <DisclosurePanel>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-8 px-2">
          {datastores?.map((datastore) => (
            <Link
              to={`/universes/${universe.id}/datastores/${datastore.id}`}
              className="text-sm text-ellipsis overflow-clip whitespace-nowrap hover:bg-neutral-600 transition-colors duration-150 px-2 py-1 rounded-md"
            >
              {datastore.id}
            </Link>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

function AddUniverse() {
  const [isOpen, setOpen] = useState(false);
  const { mutate } = useSWRConfig();

  async function onSubmit(formData: FormData) {
    const new_universe = formData.get("universe");
    await invoke("add_universe", {
      universe: new_universe,
    });
    setOpen(false);
    mutate(`universes`);
  }

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2">
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

        <span>Add Universe</span>
      </Button>
      <ModalOverlay className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50">
        <Modal className="max-w-screen-lg max-h-[75%] overflow-y-auto scrollbar bg-neutral-800 outline-none p-8 rounded-md">
          <Dialog className="outline-none flex flex-col items-center">
            <Heading slot="title" className="font-bold text-2xl">
              Add Universe
            </Heading>
            <form action={onSubmit} className="outline-none mt-12 w-full">
              <TextField
                name="universe"
                isRequired
                className="flex gap-x-6 items-center"
              >
                <Label className="font-semibold">Universe ID</Label>
                <Input className="bg-neutral-700 p-2 rounded-lg" />
              </TextField>
              <div className="flex w-full justify-evenly mt-12">
                <Button
                  type="button"
                  onPress={() => setOpen(false)}
                  className="px-3 py-2 hover:bg-neutral-700 rounded-md"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Add
                </Button>
              </div>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
