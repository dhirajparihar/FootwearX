import { login } from "@/app/actions/auth";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="login-page"><form action={login} className="card login-card"><div className="logo">Footwear Inventory</div><h1>Sign in</h1><p className="muted">Manage products, stock and sales.</p>{params.error && <div className="error">{params.error}</div>}<div className="field"><label>Email</label><input className="input" name="email" type="email" required autoComplete="email" /></div><div className="field"><label>Password</label><input className="input" name="password" type="password" required autoComplete="current-password" /></div><button className="btn btn-primary" type="submit">Sign in</button></form></main>;
}
