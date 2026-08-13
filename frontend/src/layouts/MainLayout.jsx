import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import useUiStore from "../store/uiStore";
import { clsx } from "clsx";
import { navigation } from "../config/navigation";
import { useBackButton } from "../hooks/useBackButton";

// Trouver le titre de la page depuis la config
const getPageTitle = (pathname) => {
  for (const section of navigation) {
    for (const item of section.items) {
      if (item.path === pathname) return item.label;
    }
  }
  return "ERP Auto";
};

export default function MainLayout() {
  useBackButton();

  const { sidebarOpen } = useUiStore();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => useUiStore.getState().setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed lg:relative inset-y-0 left-0 z-30",
          "lg:flex shrink-0",
          sidebarOpen ? "flex" : "hidden lg:flex",
        )}
      >
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
        <Topbar title={title} />

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Notifications toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e2a3b",
            color: "#fff",
            borderRadius: "10px",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
    </div>
  );
}
