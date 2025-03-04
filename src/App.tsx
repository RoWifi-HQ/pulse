import {
  type NavigateOptions,
  Route,
  Routes,
  useHref,
  useNavigate,
} from "react-router";
import { RouterProvider } from "react-aria-components";
import Home from "./routes";
import Layout from "./routes/layout";
import DatastorePage from "./routes/datastores";
import { GlobalToastRegion } from "./toast";
import DatastoreEntryPage from "./routes/datastores/entry";

import "./App.css";
import DatastoreNewPage from "./routes/datastores/new";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export default function App() {
  let navigate = useNavigate();

  return (
    <>
      <RouterProvider navigate={navigate} useHref={useHref}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/universes/:universe_id/datastores/:datastore_id">
              <Route index element={<DatastorePage />} />
              <Route
                path="entries/:entry_id"
                element={<DatastoreEntryPage />}
              />
              <Route path="new" element={<DatastoreNewPage />} />
            </Route>
          </Route>
        </Routes>
      </RouterProvider>
      <GlobalToastRegion />
    </>
  );
}
