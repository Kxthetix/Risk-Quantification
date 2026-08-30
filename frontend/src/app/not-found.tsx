import Link from "next/link";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-inner">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">404</h1>
      <h2 className="mt-2 text-lg font-semibold text-foreground">Page Not Found</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        The requested cybersecurity module or report could not be found or may have been moved.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
