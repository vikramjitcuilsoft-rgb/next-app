import Header from "@/components/header/page";
import Sidebar from "@/components/sidebar/page";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-shrink-0">
          <Header />
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
