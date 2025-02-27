import { useState } from "react";
import {
  Disclosure,
  Heading,
  Button,
  DisclosurePanel,
  Select,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
} from "react-aria-components";
import { KVJsonValue, JsonType, KVJsonObject } from "../../../types";
import { getJSONType } from "../../../utils";
import { useEntry } from "../context";

export function DatastoreEntryData({
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

export function DatastoreEntryDataMap({
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

export function DatastoreEntryDataArray({
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

export function DatastoreEntryDataPrimitive({
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

export function DatastoreEntryDataTypeSelect({
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
