"use client";

import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider delay={300}>
          <LazyMotion features={domAnimation}>
            <MotionConfig reducedMotion="user">
              {children}
            </MotionConfig>
          </LazyMotion>
          <Toaster position="bottom-right" richColors closeButton />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
