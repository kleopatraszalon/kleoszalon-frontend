import React from "react";
import Sidebar from "../components/Sidebar";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  return (
    <div className="altegio-page-shell app-layout-shell">
      <Sidebar user={user} />
      <div className="altegio-main app-layout-main">{children}</div>
    </div>
  );
}
