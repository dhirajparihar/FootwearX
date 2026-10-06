"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.print()}>
      <Printer className="h-4 w-4 mr-2" /> Print Summary
    </Button>
  );
}
