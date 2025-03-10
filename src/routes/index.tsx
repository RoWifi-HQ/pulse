import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Link } from "react-router";
import useSWR, { mutate, useSWRConfig } from "swr";
import type { StoredUniverse, Datastore } from "../types";
import * as Dialog from "@radix-ui/react-dialog";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Label from "@radix-ui/react-label";

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
    <div className="min-h-screen bg-neutral-900 text-neutral-100 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Datastore Manager
          </h1>
          <p className="text-neutral-400">
            Manage your universes and datastores
          </p>
        </header>

        <TokenSection token={init_info?.token} />
        <UniverseSection />
      </div>
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
    mutate("init");
  }

  return (
    <section className="bg-neutral-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5 text-blue-400"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        API Token
      </h2>
      <div className="bg-neutral-700/50 p-4 rounded-lg border border-neutral-700">
        {formOpen ? (
          <form action={onSubmit} className="flex w-full items-center gap-3">
            <div className="w-full">
              <Label.Root htmlFor="token" className="sr-only">
                API Token
              </Label.Root>
              <input
                id="token"
                name="token"
                required
                className="w-full bg-neutral-800 border border-neutral-600 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-md transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-300">
                {token ? "••••••••••••" : "No token set"}
              </span>
              {token && (
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <button
              onClick={() => setFormOpen(true)}
              className="bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center gap-2 text-sm font-medium border border-blue-500/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                />
              </svg>
              Edit Token
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function UniverseSection() {
  const {
    data: universes,
    error,
    isLoading,
  } = useSWR("universes", () => getUniverses(), { revalidateOnFocus: false });

  return (
    <section className="bg-neutral-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5 text-blue-400"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4"></circle>
            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
            <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
          </svg>
          Universes
        </h2>
        <AddUniverse />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">
          Failed to load universes. Please check your connection and try again.
        </div>
      ) : universes?.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 bg-neutral-700/30 rounded-lg border border-dashed border-neutral-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>No universes found. Add your first universe to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {universes?.map((universe) => (
            <UniverseCard key={universe.id} universe={universe} />
          ))}
        </div>
      )}
    </section>
  );
}

function UniverseCard({ universe }: { universe: StoredUniverse }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: datastores, isLoading } = useSWR(
    isExpanded ? `universes/${universe.id}` : null,
    () => list_datastores(universe.id)
  );

  return (
    <Collapsible.Root
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="bg-neutral-700 rounded-lg overflow-hidden shadow-md border border-neutral-600/50 hover:border-neutral-500/50 transition-colors"
    >
      <Collapsible.Trigger asChild>
        <button className="w-full p-4 text-left font-medium flex justify-between items-center transition-colors duration-200 rounded-lg focus:outline-none group">
          <div className="flex items-center gap-3">
            <span className="text-neutral-200">{universe.name}</span>
            <span className="text-xs text-neutral-400">ID: {universe.id}</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="px-4 pb-4">
        <div className="pt-2 pb-3 text-sm text-neutral-400 flex items-center justify-between">
          <span>Datastores</span>
          <span className="bg-neutral-600/50 px-2 py-0.5 rounded-full text-xs">
            {datastores?.length || 0} items
          </span>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : datastores?.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 bg-neutral-700/30 rounded-lg">
            No datastores found for this universe.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {datastores?.map((datastore) => (
              <Link
                key={datastore.id}
                to={`/universes/${universe.id}/datastores/${datastore.id}`}
                className="bg-neutral-600/30 hover:bg-neutral-600/50 transition-colors px-3 py-2 rounded-md text-sm truncate flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 text-neutral-400 shrink-0"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="truncate">{datastore.id}</span>
              </Link>
            ))}
          </div>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
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
    mutate("universes");
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center gap-2 text-sm font-medium border border-blue-500/20">
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
          Add Universe
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden z-50 p-0">
          <div className="p-6 border-b border-neutral-700">
            <Dialog.Title className="font-bold text-xl text-white">
              Add Universe
            </Dialog.Title>
            <Dialog.Description className="text-neutral-400 text-sm mt-1">
              Enter the Universe ID to add it to your dashboard
            </Dialog.Description>
          </div>
          <form action={onSubmit} className="p-6">
            <div className="flex flex-col gap-2">
              <Label.Root
                htmlFor="universe"
                className="text-sm font-medium text-neutral-300"
              >
                Universe ID
              </Label.Root>
              <input
                id="universe"
                name="universe"
                required
                className="bg-neutral-700 border border-neutral-600 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
              >
                Add Universe
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
