"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  GraduationCap,
  User,
  FileText,
  FlaskConical,
  Brain,
  Network,
  Calculator,
  LayoutDashboard,
  ClipboardCheck,
} from "lucide-react";
import { siteConfig, getNav } from "@/lib/site-config";
import { getProducts } from "@/lib/products";
import { getFeatureFlags } from "@/lib/features";

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="mr-2 h-4 w-4" />,
  Learning: <GraduationCap className="mr-2 h-4 w-4" />,
  Practice: <FlaskConical className="mr-2 h-4 w-4" />,
  Flashcards: <Brain className="mr-2 h-4 w-4" />,
  Formulas: <Calculator className="mr-2 h-4 w-4" />,
  Dashboard: <LayoutDashboard className="mr-2 h-4 w-4" />,
  About: <User className="mr-2 h-4 w-4" />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toolItems = useMemo(() => {
    const flags = getFeatureFlags();
    const all: { href: string; title: string; icon: React.ReactNode; on: boolean }[] = [
      { href: "/practice", title: "Practice Problems", icon: <FlaskConical className="mr-2 h-4 w-4" />, on: flags.practice },
      { href: "/flashcards", title: "Flashcards", icon: <Brain className="mr-2 h-4 w-4" />, on: flags.flashcards },
      { href: "/formulas", title: "Formula Index", icon: <Calculator className="mr-2 h-4 w-4" />, on: flags.formulas },
      { href: "/knowledge-graph", title: "Knowledge Graph", icon: <Network className="mr-2 h-4 w-4" />, on: flags.knowledgeGraph },
      { href: "/exam", title: "Exam Simulator", icon: <ClipboardCheck className="mr-2 h-4 w-4" />, on: flags.exam },
      { href: "/dashboard", title: "Study Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" />, on: flags.dashboard },
    ];
    return all.filter((t) => t.on);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Command Palette</DialogTitle>
        <DialogDescription>Search pages, products, and tools...</DialogDescription>
      </DialogHeader>
      <DialogContent className="top-1/3 translate-y-0 overflow-hidden rounded-xl p-0" showCloseButton={false}>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search pages, products..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Pages">
              {getNav().map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => runCommand(() => router.push(item.href))}
                >
                  {iconMap[item.title] || <FileText className="mr-2 h-4 w-4" />}
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Products">
              {getProducts().map((product) => (
                <CommandItem
                  key={product.slug}
                  onSelect={() => runCommand(() => router.push(product.href))}
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span>{product.title}</span>
                  {product.badge && (
                    <span className="ml-auto text-[0.6rem] text-muted-foreground">
                      {product.badge}
                    </span>
                  )}
                </CommandItem>
              ))}
              <CommandItem
                onSelect={() => runCommand(() => router.push("/pricing"))}
              >
                <FileText className="mr-2 h-4 w-4" />
                Pricing
              </CommandItem>
            </CommandGroup>

            {toolItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tools">
                  {toolItems.map((tool) => (
                    <CommandItem
                      key={tool.href}
                      onSelect={() => runCommand(() => router.push(tool.href))}
                    >
                      {tool.icon}
                      {tool.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />

            <CommandGroup heading="Links">
              <CommandItem
                onSelect={() =>
                  runCommand(() => window.open(siteConfig.links.github, "_blank"))
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                GitHub
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => window.open(siteConfig.links.linkedin, "_blank"))
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                LinkedIn
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
