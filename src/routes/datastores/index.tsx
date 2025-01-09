import { invoke } from "@tauri-apps/api/core";
import { useLayoutEffect, useState } from "react";
import {
  Cell,
  Column,
  ColumnResizer,
  ResizableTableContainer,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "react-aria-components";
import { useParams } from "react-router";
import useSWR from "swr";

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
  await invoke("list_data_store_entries", { universe_id, datastore_id, page });
  const entries = await invoke("get_data_store_entries", {
    universe_id,
    datastore_id,
    page,
  });
  return entries as DatastoreEntry[];
}

export default function DatastorePage() {
  const params = useParams();
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState([{ id: "Id", isRowHeader: true }]);

  const { data: entries } = useSWR(
    `universes/${params.universe_id!}/datastores/${params.datastore_id!}`,
    () =>
      get_data_entries(
        parseInt(params.universe_id!),
        params.datastore_id!,
        page
      )
  );

  useLayoutEffect(() => {
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
      setColumns([
        { id: "Id", isRowHeader: true },
        ...Array.from(columnsToAdd.values()).map((c) => {
          return { id: c, isRowHeader: false };
        }),
        { id: "Edit", isRowHeader: false },
      ]);
    }
  }, [entries]);
  console.log(columns);

  return (
    <div className="w-full h-full overflow-auto scrollbar">
      <Table aria-label="Datastore Entries Table" className="max-w-screen-lg">
        <TableHeader columns={columns}>
          {(column) => (
            <Column
              key={column.id}
              isRowHeader={column.isRowHeader}
              maxWidth={`25%`}
            >
              <div className="flex text-center px-3">
                {column.id}
                {/* <ColumnResizer className="w-1 bg-neutral-200 ml-auto cursor-ew-resize" /> */}
              </div>
            </Column>
          )}
        </TableHeader>
        <TableBody items={entries ?? []} dependencies={[columns]}>
          {(item) => {
            if (isJsonMap(item.value)) {
              const value = item.value as JsonMap;
              return (
                <Row key={item.id} columns={columns} className="text-sm">
                  {(column) => {
                    if (column.id === "Id") {
                      return <Cell key={column.id}>{item.id}</Cell>;
                    } else if (column.id === "Edit") {
                      return (
                        <button className="rounded-xl hover:bg-neutral-700 h-8 w-8 p-2">
                          Edit
                        </button>
                      );
                    }
                    return (
                      <Cell key={column.id} className="py-3 px-6">
                        <code className="max-h-36 block text-ellipsis overflow-hidden">
                          {JSON.stringify(value[column.id])}
                        </code>
                      </Cell>
                    );
                  }}
                </Row>
              );
            } else {
              return <Row></Row>;
            }
          }}
        </TableBody>
      </Table>
    </div>
  );
}
