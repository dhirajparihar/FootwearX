import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
export async function AppShell({children}:{children:React.ReactNode}){const user=await requireUser();return <div className="shell"><Sidebar role={user.role}/><main className="main"><header className="topbar"><div><strong>{user.shop.name}</strong><span className="muted top-role"> · {user.name}</span></div><form action={logout}><button className="btn btn-small" type="submit">Sign out</button></form></header>{children}</main></div>}
