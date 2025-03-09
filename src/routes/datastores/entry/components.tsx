import React, { useCallback, useState } from "react";
import { Heading, Button } from "react-aria-components";
import * as Select from "@radix-ui/react-select";
import { type KVJsonValue, JsonType, type KVJsonObject } from "../../../types";
import { useEntry } from "../context";

export const DatastoreEntryData = React.memo(
  ({
    path,
    value,
    type,
  }: {
    path: string[];
    value: KVJsonValue;
    type: JsonType;
  }) => {
    const [isExpanded, setExpanded] = useState(false);
    const { entry, setEntry } = useEntry();

    const addObjectItem = useCallback(() => {
      const updatedEntry = structuredClone(entry);

      let current = updatedEntry as KVJsonObject;
      for (let i = 0; i < path.length; i++) {
        current = current.find((v) => v.key == path[i])?.value as KVJsonObject;
      }

      current.push({
        key:
          type === JsonType.Object
            ? `field${current.length}`
            : current.length.toString(),
        value: "",
        type: JsonType.String,
      });
      setEntry(updatedEntry);
    }, [path]);

    const removeCurrent = useCallback(() => {
      const updatedEntry = structuredClone(entry);

      let current = updatedEntry as KVJsonObject;
      for (let i = 0; i < path.length - 1; i++) {
        current = current.find((v) => v.key == path[i])?.value as KVJsonObject;
      }

      const index = current.findIndex((v) => v.key == path[path.length - 1]);
      current.splice(index, 1);
      setEntry(updatedEntry);
    }, [path]);

    const onTypeChange = useCallback(
      (new_type: JsonType) => {
        const updatedEntry = structuredClone(entry);
        if (new_type !== type) {
          let current = updatedEntry as KVJsonObject;
          for (let i = 0; i < path.length - 1; i++) {
            current = current.find((v) => v.key == path[i])
              ?.value as KVJsonObject;
          }

          const index = current.findIndex(
            (v) => v.key == path[path.length - 1]
          );
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
      },
      [path]
    );

    const onKeyChange = useCallback(
      (new_key: string) => {
        const updatedEntry = structuredClone(entry);

        let current = updatedEntry as KVJsonObject;
        for (let i = 0; i < path.length - 1; i++) {
          current = current.find((v) => v.key == path[i])
            ?.value as KVJsonObject;
        }

        const index = current.findIndex((v) => v.key == path[path.length - 1]);
        current[index].key = new_key;
        setEntry(updatedEntry);
      },
      [path]
    );

    const onValueChange = useCallback(
      (new_value: any) => {
        if (typeof value === "number") {
          new_value = parseInt(new_value);
        }

        if (path.length > 0) {
          const updatedEntry = structuredClone(entry);
          let current = updatedEntry as KVJsonObject;
          for (let i = 0; i < path.length - 1; i++) {
            current = current.find((v) => v.key == path[i])
              ?.value as KVJsonObject;
          }

          const index = current.findIndex(
            (v) => v.key == path[path.length - 1]
          );
          current[index].value = new_value;
          setEntry(updatedEntry);
        } else {
          setEntry(new_value);
        }
      },
      [path]
    );

    switch (type) {
      case JsonType.Object:
      case JsonType.Array: {
        return (
          <div>
            <Heading className="flex items-center gap-x-3 py-2 group">
              <Button
                slot="trigger"
                onPress={() => setExpanded(!isExpanded)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-4 transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
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
                className="bg-neutral-800/50 border border-neutral-700 focus:border-neutral-500 px-2 py-1 rounded-md focus:outline-none transition-colors"
                value={path[path.length - 1]}
                onChange={(e) => onKeyChange(e.target.value)}
              />
              <div className="ml-auto flex items-center gap-x-2">
                <EntryTypeSelect defaultValue={type} onChange={onTypeChange} />
              </div>
              <Button
                className="p-1.5 rounded-md bg-neutral-800/80 hover:bg-emerald-500/20 text-neutral-400 hover:text-emerald-400 transition-all"
                onPress={() => addObjectItem()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </Button>
              <Button
                onPress={() => removeCurrent()}
                className="p-1.5 rounded-md bg-neutral-800/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12h-15"
                  />
                </svg>
              </Button>
            </Heading>
            <div
              className={`pl-4 border-l border-neutral-700 ml-1 mt-1 space-y-1 ${
                !isExpanded ? "hidden" : ""
              }`}
            >
              {(value as KVJsonObject).map((entry) => (
                <DatastoreEntryData
                  path={[...path, entry.key]}
                  value={entry.value}
                  type={entry.type}
                />
              ))}
            </div>
          </div>
        );
      }
      default: {
        return (
          <div
            className="flex items-center gap-x-3 py-1.5 px-1 rounded-md hover:bg-neutral-800/30"
            tabIndex={-1}
          >
            {path.length > 0 ? (
              <>
                <input
                  type="text"
                  className="bg-neutral-800/50 border border-neutral-700 focus:border-neutral-500 px-2 py-1 rounded-md focus:outline-none transition-colors w-32"
                  value={path[path.length - 1]}
                  onChange={(e) => onKeyChange(e.target.value)}
                />
                <span className="text-neutral-400">:</span>
                <input
                  type={typeof value === "number" ? "number" : "text"}
                  value={value?.toString()}
                  onChange={(e) => onValueChange(e.target.value)}
                  className="bg-neutral-800/50 border border-neutral-700 focus:border-neutral-500 px-2 py-1 rounded-md focus:outline-none transition-colors flex-1 min-w-[120px]"
                />
                <EntryTypeSelect defaultValue={type} onChange={onTypeChange} />
                <Button
                  onPress={() => removeCurrent()}
                  className="p-1.5 rounded-md bg-neutral-800/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="size-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12h-15"
                    />
                  </svg>
                </Button>
              </>
            ) : (
              <input
                type={typeof value === "number" ? "number" : "text"}
                value={value?.toString()}
                onChange={(e) => onValueChange(e.target.value)}
                className="bg-neutral-800/50 border border-neutral-700 focus:border-neutral-500 px-2 py-1 rounded-md focus:outline-none transition-colors flex-1 min-w-[120px]"
              />
            )}
          </div>
        );
      }
    }
  }
);

export const EntryTypeSelect = React.memo(
  ({
    defaultValue,
    onChange,
  }: {
    defaultValue: JsonType;
    onChange?: (t: JsonType) => void;
  }) => {
    const [selectedValue, setSelectedValue] = React.useState(defaultValue);

    const handleChange = (value: JsonType) => {
      setSelectedValue(value);
      onChange?.(value);
    };

    return (
      <Select.Root value={selectedValue} onValueChange={handleChange}>
        <Select.Trigger className="flex h-8 w-28 items-center justify-between whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-800/50 px-2 py-1 text-sm shadow-sm hover:border-neutral-600 focus:border-neutral-500 transition-colors">
          <span className="text-neutral-400 text-xs mr-1">type:</span>
          <span className="text-neutral-200">{selectedValue}</span>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-neutral-700 bg-neutral-800 text-neutral-200 shadow-md"
            position="popper"
          >
            <Select.Viewport className="p-1">
              <Select.Item
                value={JsonType.Array.toString()}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-neutral-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Select.ItemText>Array</Select.ItemText>
              </Select.Item>
              <Select.Item
                value={JsonType.Object.toString()}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-neutral-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Select.ItemText>Object</Select.ItemText>
              </Select.Item>
              <Select.Item
                value={JsonType.Number.toString()}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-neutral-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Select.ItemText>Number</Select.ItemText>
              </Select.Item>
              <Select.Item
                value={JsonType.Boolean.toString()}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-neutral-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Select.ItemText>Boolean</Select.ItemText>
              </Select.Item>
              <Select.Item
                value={JsonType.String.toString()}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-neutral-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Select.ItemText>String</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    );
  }
);
