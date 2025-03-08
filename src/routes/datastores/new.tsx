import { invoke } from "@tauri-apps/api/core"
import { useState } from "react"
import { useParams, Link } from "react-router"
import { toast_queue } from "../../toast"
import { JsonType, type TauriError, ErrorKind, type KVJsonObject } from "../../types"
import { toKVJsonValue, toJsonValue } from "../../utils"
import { EntryContext } from "./context"
import { DatastoreEntryData } from "./entry/components"
import { TextField, Label, Input, Button } from "react-aria-components"

export default function DatastoreNewPage() {
  const params = useParams()

  return (
    <div className="h-full w-full flex flex-col bg-neutral-900 text-neutral-100">
      <div className="p-6 border-b border-neutral-800">
        <nav className="flex items-center text-sm text-neutral-400">
          <Link to="/" className="hover:text-neutral-200 transition-colors">
            Universes
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-4 h-4 mx-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>{params.universe_id}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-4 h-4 mx-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}`}
            className="hover:text-neutral-200 transition-colors"
          >
            {params.datastore_id}
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-4 h-4 mx-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-blue-400 font-medium">New Entry</span>
        </nav>
      </div>

      <div className="flex-grow p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-neutral-100">Create New Entry</h1>
          <EntryForm />
        </div>
      </div>
    </div>
  )
}

function EntryForm() {
  const params = useParams()
  const [entryState, setEntryState] = useState(toKVJsonValue({ field1: "" }))
  const [id, setId] = useState("")

  async function onSubmit() {
    const value = toJsonValue(entryState, JsonType.Object)
    try {
      await invoke("update_datastore_entry", {
        entry_id: id,
        value,
        attributes: {},
        users: [],
      })

      toast_queue.add({ success: true, description: "Entry Created" }, { timeout: 5000 })

      // Redirect to the datastore page after successful creation
      window.location.href = `/universes/${params.universe_id}/datastores/${params.datastore_id}`
    } catch (error) {
      const err = error as TauriError
      let description = ""
      if (err.kind == ErrorKind.Forbidden) description = "The token does not have permissions to create entries."
      else description = "Something went wrong."
      toast_queue.add({ success: false, description: description }, { timeout: 5000 })
    }
  }

  return (
    <form action={onSubmit} className="bg-neutral-800 rounded-lg p-6 shadow-lg">
      <div className="mb-6">
        <TextField name="id" isRequired value={id} onChange={setId} className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-neutral-300">Entry ID</Label>
          <Input className="bg-neutral-700 border border-neutral-600 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </TextField>
      </div>

      <div className="border-t border-neutral-700 pt-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-neutral-200">Entry Data</h2>
        <div className="bg-neutral-750 rounded-lg p-4">
          <EntryContext.Provider
            value={{
              entry: entryState,
              setEntry: (newEntry) => {
                setEntryState(newEntry)
              },
            }}
          >
            {(entryState as KVJsonObject).map((entry) => (
              <DatastoreEntryData key={entry.key} path={[entry.key]} value={entry.value} type={entry.type} />
            ))}
          </EntryContext.Provider>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Link
          to={`/universes/${params.universe_id}/datastores/${params.datastore_id}`}
          className="px-6 py-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
        >
          Create Entry
        </Button>
      </div>
    </form>
  )
}

