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
import DatastoreLayout from "./routes/datastores/layout";
import { GlobalToastRegion } from "./toast";

import "./App.css";

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
            <Route
              path="/universes/:universe_id/datastores/:datastore_id"
              element={<DatastoreLayout />}
            >
              <Route index element={<DatastorePage />} />
            </Route>
          </Route>
        </Routes>
      </RouterProvider>
      <GlobalToastRegion />
    </>
  );
}
