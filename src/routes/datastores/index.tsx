import {
  CellContext,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { invoke } from "@tauri-apps/api/core";
import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Label,
  Modal,
  ModalOverlay,
  TextArea,
  TextField,
} from "react-aria-components";
import { useParams } from "react-router";
import useSWR, { useSWRConfig } from "swr";

type JsonMap = { [key: string]: JsonValue };

type JsonValue = string | number | boolean | null | JsonValue[] | JsonMap;

function isJsonValue(value: unknown): value is JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function isJsonMap(value: unknown): value is JsonMap {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isJsonValue)
  );
}

enum DatastoreEntryState {
  Unspecified = "STATE_UNSPECIFIED",
  Active = "ACTIVE",
  Deleted = "DELETED",
}

type DatastoreEntry = {
  createTime: string;
  revisionId: string;
  revisionCreateTime: string;
  state: DatastoreEntryState;
  etag: string;
  value: JsonValue;
  id: string;
  users: string[];
  attributes: any;
};

async function get_data_entries(
  universe_id: number,
  datastore_id: string,
  page: number
) {
  const entries = await invoke("get_datastore_entries", {
    universe_id,
    datastore_id,
    page,
  });
  return entries as DatastoreEntry[];
}

const fallbackEntries: never[] = [];

export default function DatastorePage() {
  const params = useParams();
  const [page, setPage] = useState(1);

  const { data: entries } = useSWR(
    `universes/${params.universe_id!}/datastores/${params.datastore_id!}/page/${page}`,
    () =>
      get_data_entries(
        parseInt(params.universe_id!),
        params.datastore_id!,
        page
      ),
    {
      revalidateOnFocus: false,
    }
  );

  const columns: ColumnDef<DatastoreEntry>[] = useMemo(() => {
    if (entries) {
      const columnsToAdd = new Set<string>();
      for (const entry of entries) {
        if (isJsonMap(entry.value)) {
          const value = entry.value as JsonMap;
          for (const key of Object.keys(value)) {
            const col = key as unknown as string;
            columnsToAdd.add(col);
          }
        }
      }
      return [
        {
          header: "Id",
          accessorFn: (row: DatastoreEntry) => row.id,
          cell: (info) => info.getValue(),
        },
        ...Array.from(columnsToAdd).map((c) => {
          return {
            id: c,
            header: () => c,
            cell: (info: CellContext<DatastoreEntry, unknown>) => (
              <code
                className="max-h-36 block text-ellipsis overflow-hidden text-sm"
                style={{ width: info.cell.column.getSize() }}
              >
                {JSON.stringify(info.getValue())}
              </code>
            ),
            accessorFn: (row: any) => row.value[c],
          };
        }),
        {
          header: "Edit",
          cell: (info: CellContext<DatastoreEntry, unknown>) => (
            <div className="flex items-center gap-x-4">
              <EditModal
                universe_id={parseInt(params.universe_id!)}
                datastore_id={params.datastore_id!}
                page={page}
                entry={info.row.original}
              />
              <DeleteModal
                universe_id={parseInt(params.universe_id!)}
                datastore_id={params.datastore_id!}
                page={page}
                entry={info.row.original}
              />
            </div>
          ),
        },
      ];
    }
    return [];
  }, [entries]);

  const table = useReactTable({
    columns,
    data: entries ?? fallbackEntries,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onEnd",
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    debugAll: true,
  });

  return (
    <div className="h-full w-full flex flex-col">
      <div className="w-full h-full overflow-auto scrollbar">
        <table
          {...{
            style: {
              width: table.getCenterTotalSize(),
            },
          }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="relative"
                    key={header.id}
                    {...{
                      colSpan: header.colSpan,
                      style: {
                        width: header.getSize(),
                      },
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    <div
                      className={`absolute top-0 h-full w-[5px] cursor-ew-resize bg-neutral-200 right-0 opacity-0 hover:opacity-100 ${
                        table.options.columnResizeDirection
                      } ${
                        header.column.getIsResizing()
                          ? "bg-neutral-700 opacity-100"
                          : ""
                      }`}
                      {...{
                        onDoubleClick: () => header.column.resetSize(),
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        style: {
                          transform: header.column.getIsResizing()
                            ? `translateX(${
                                table.getState().columnSizingInfo.deltaOffset ??
                                0
                              }px)`
                            : "",
                        },
                      }}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="py-3 px-6"
                    key={cell.id}
                    {...{
                      style: {
                        width: cell.column.getSize(),
                      },
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
}

interface EditModalProps {
  universe_id: number;
  datastore_id: string;
  page: number;
  entry: DatastoreEntry;
}

function EditModal({ universe_id, datastore_id, entry, page }: EditModalProps) {
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
    await invoke("update_datastore_entry", {
      entry_id: entry.id,
      value: JSON.stringify(value),
      attributes: entry.attributes,
      users: entry.users,
    });
    setOpen(false);
    mutate(`universes/${universe_id}/datastores/${datastore_id}/page/${page}`);
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
        <Modal
          className="max-w-screen-lg max-h-[75%] overflow-y-auto scrollbar bg-neutral-800 outline-none p-8 rounded-md"
        >
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

interface DeleteModalProps {
  universe_id: number;
  datastore_id: string;
  page: number;
  entry: DatastoreEntry;
}

function DeleteModal({
  universe_id,
  datastore_id,
  entry,
  page,
}: DeleteModalProps) {
  const [isOpen, setOpen] = useState(false);
  const { mutate } = useSWRConfig();

  async function onSubmit() {
    await invoke("delete_datastore_entry", {
      page,
      entry_id: entry.id,
    });
    setOpen(false);
    mutate(`universes/${universe_id}/datastores/${datastore_id}/page/${page}`);
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
            <form
              action={onSubmit}
              className="outline-none mt-12 w-full"
            >
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
