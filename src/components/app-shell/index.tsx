import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNav } from "./mobile-nav";
import { Topbar } from "./topbar";
import { requireUser } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
      <DesktopSidebar role={user.role} />
      
      <div className="flex flex-col sm:gap-4 sm:py-4 md:flex-1 min-w-0">
        <Topbar user={{ name: user.name, role: user.role }} shopName={user.shop.name} />
        
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 md:pb-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
