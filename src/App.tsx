import { Route, Routes } from "react-router";
import Home from "./routes";
import Layout from "./routes/layout";
import DatastorePage from "./routes/datastores";
import { GlobalToastRegion } from "./toast";
import DatastoreEntryPage from "./routes/datastores/entry";
import DatastoreNewPage from "./routes/datastores/new";

import "./App.css";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/universes/:universe_id/datastores/:datastore_id">
            <Route index element={<DatastorePage />} />
            <Route path="entries/:entry_id" element={<DatastoreEntryPage />} />
            <Route path="new" element={<DatastoreNewPage />} />
          </Route>
        </Route>
      </Routes>
      <GlobalToastRegion />
    </>
  );
}
