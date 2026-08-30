import Link from "next/link";
import { ShieldX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-6 shadow-inner">
        <ShieldX className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">403</h1>
      <h2 className="mt-2 text-lg font-semibold text-foreground">Access Restricted</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        You do not have the required role or authorization level to access this security resource. Please contact your organization security administrator if you believe this is an error.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button size="sm" asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
