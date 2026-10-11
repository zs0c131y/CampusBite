import { Navbar } from "./Navbar";
import { CampusToaster } from "@/components/shared/CampusToaster";
import { cn } from "@/lib/utils";
import { PwaNudge } from "@/components/shared/PwaNudge";
import { useAuth } from "@/contexts/AuthContext";

export function Layout({ children, hideNavbar = false, fluid = false }) {
  const { user } = useAuth();
  const isWorkspace = !hideNavbar && user?.role === "store_employee";
  const isStudent = !hideNavbar && ["student", "faculty"].includes(user?.role);
  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        !hideNavbar && "app-shell",
        isWorkspace && "lg:pl-60",
        isStudent && "pb-20 md:pb-0",
      )}
    >
      <div className="flex min-h-screen flex-col">
        {!hideNavbar && <Navbar />}
        <main
          id="main-content"
          className={cn(
            "min-w-0 flex-1",
            fluid
              ? "w-full"
              : "mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:py-10",
          )}
        >
          {children}
        </main>
        <footer className="border-t">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:px-8">
            <span className="font-semibold text-foreground">
              campusbite.{" "}
              <span className="ml-3 font-normal text-muted-foreground">
                Campus food ordering.
              </span>
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <PwaNudge />
              <p>
                Built by{" "}
                <a
                  href="https://adarshg.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-foreground hover:text-primary"
                >
                  Adarsh Gupta
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
      <CampusToaster />
    </div>
  );
}
