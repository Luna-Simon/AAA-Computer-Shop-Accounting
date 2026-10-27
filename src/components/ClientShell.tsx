"use client";

import { AuthProvider } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function ClientShell({
  children,
}: React.PropsWithChildren<{}>) {
  return (
    <AuthProvider>
      <div className="flex flex-1 h-screen overflow-hidden relative z-10">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
