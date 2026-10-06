import { login } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">FootwearX</CardTitle>
          <CardDescription>Sign in to manage products, stock and sales.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={login} className="space-y-5">
            {params.error && (
              <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-md text-center border border-destructive/20">
                {params.error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email address</label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  autoComplete="email" 
                  placeholder="admin@shop.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  autoComplete="current-password" 
                  placeholder="••••••••"
                  className="h-11"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-11 text-base font-semibold" size="lg">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
