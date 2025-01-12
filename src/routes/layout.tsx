import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 h-full w-full">
        <Outlet />
      </main>
    </div>
  );
}
