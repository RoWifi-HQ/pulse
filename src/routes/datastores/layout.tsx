import { Link, Outlet, useParams } from "react-router";

export default function DatastoreLayout() {
  const params = useParams();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-x-1 text-neutral-300 text-sm">
          <Link to="/" className="hover:text-neutral-500">
            Universes
          </Link>
          <span>{">"}</span>
          <span>{params.universe_id}</span>
          <span>{">"}</span>
          <Link
            to={`/universes/${params.universe_id}/datastores/${params.datastore_id}`}
            className="hover:text-neutral-500"
          >
            {params.datastore_id}
          </Link>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
