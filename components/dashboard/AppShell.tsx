import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({
  email,
  isAdmin,
  children,
}: {
  email?: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-h-full flex-1 flex-col">
        <Topbar email={email} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
