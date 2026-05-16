"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
  FolderOpen,
  PenLine,
  BookOpen,
  Briefcase,
  User,
  Mail,
  FileText,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="mr-2 h-4 w-4" />,
  Projects: <FolderOpen className="mr-2 h-4 w-4" />,
  Writing: <PenLine className="mr-2 h-4 w-4" />,
  Notebook: <BookOpen className="mr-2 h-4 w-4" />,
  Services: <Briefcase className="mr-2 h-4 w-4" />,
  About: <User className="mr-2 h-4 w-4" />,
  Contact: <Mail className="mr-2 h-4 w-4" />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
        <DialogDescription>Search for a command to run...</DialogDescription>
      </DialogHeader>
      <DialogContent className="top-1/3 translate-y-0 overflow-hidden rounded-xl p-0" showCloseButton={false}>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {siteConfig.nav.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => runCommand(() => router.push(item.href))}
                >
                  {iconMap[item.title] || <FileText className="mr-2 h-4 w-4" />}
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
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
