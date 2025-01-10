import { Outlet } from "react-router";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Modal,
} from "react-aria-components";
import { invoke } from "@tauri-apps/api/core";
import useSWR from "swr";

type Universe = {
  id: number;
  name: string;
};

type Datastore = {
  id: string;
};

export default function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <Sidebar />
      <main className="flex-1 h-[95vh] w-full">
        <Outlet />
      </main>
    </div>
  );
}

async function fetch_universes() {
  const res = await invoke("get_universes");
  return res as Universe[];
}

function Sidebar() {
  const { data: universes } = useSWR("universes", fetch_universes);

  return (
    <MenuTrigger>
      <Button className="outline-none h-[5vh]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </Button>

      <Modal
        isDismissable
        className="fixed top-0 left-0 h-screen outline-none bg-neutral-900 p-4 overflow-y-auto scrollbar"
      >
        <Menu className="outline-none flex flex-col">
          {(universes ?? []).map((universe) => (
            <Universe key={universe.id} universe={universe} />
          ))}
        </Menu>
      </Modal>
    </MenuTrigger>
  );
}

async function list_datastores(id: number) {
  const res = await invoke("list_datastores", { universe_id: id });
  return res as Datastore[];
}

function Universe({ universe }: { universe: Universe }) {
  const { data: datastores } = useSWR(
    `universes/${universe.id}/datastores`,
    () => list_datastores(universe.id)
  );

  return (
    <>
      <MenuItem>{universe.name}</MenuItem>
      {(datastores ?? []).map((datastore) => (
        <MenuItem
          key={datastore.id}
          href={`/universes/${universe.id}/datastores/${datastore.id}`}
        >
          {datastore.id}
        </MenuItem>
      ))}
    </>
  );
}
