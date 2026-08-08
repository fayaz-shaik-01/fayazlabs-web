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
  BookOpen,
  FlaskConical,
  Brain,
  Network,
  Calculator,
  LayoutDashboard,
  ClipboardCheck,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getAllTracks } from "@/lib/curriculum";

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

  const tracks = useMemo(() => getAllTracks(), []);
  const lessonEntries = useMemo(() => {
    return tracks.flatMap((track) =>
      track.modules.flatMap((mod) =>
        mod.lessons
          .filter((l) => l.status === "published" || l.hasContent)
          .map((lesson) => ({
            key: `${track.slug}/${mod.slug}/${lesson.slug}`,
            title: lesson.title,
            trackTitle: track.title,
            moduleTitle: mod.title,
            href: `/learning/${track.slug}/${mod.slug}/${lesson.slug}`,
            difficulty: lesson.difficulty,
          }))
      )
    );
  }, [tracks]);

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
        <DialogDescription>Search pages, lessons, tracks, and tools...</DialogDescription>
      </DialogHeader>
      <DialogContent className="top-1/3 translate-y-0 overflow-hidden rounded-xl p-0" showCloseButton={false}>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search lessons, tracks, tools..." />
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
              <CommandItem
                onSelect={() => runCommand(() => router.push("/knowledge-graph"))}
              >
                <Network className="mr-2 h-4 w-4" />
                Knowledge Graph
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Learning Tracks">
              {tracks.map((track) => (
                <CommandItem
                  key={track.slug}
                  onSelect={() => runCommand(() => router.push(`/learning/${track.slug}`))}
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span>{track.title}</span>
                  <span className="ml-auto text-[0.6rem] text-muted-foreground">
                    {track.modules.length} modules
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            {lessonEntries.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Lessons">
                  {lessonEntries.map((entry) => (
                    <CommandItem
                      key={entry.key}
                      value={`${entry.title} ${entry.trackTitle} ${entry.moduleTitle}`}
                      onSelect={() => runCommand(() => router.push(entry.href))}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span className="truncate">{entry.title}</span>
                      <span className="ml-auto text-[0.6rem] text-muted-foreground truncate max-w-[120px]">
                        {entry.trackTitle}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />

            <CommandGroup heading="Tools">
              <CommandItem
                onSelect={() => runCommand(() => router.push("/practice"))}
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                Practice Problems
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/flashcards"))}
              >
                <Brain className="mr-2 h-4 w-4" />
                Flashcards
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/formulas"))}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Formula Index
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/knowledge-graph"))}
              >
                <Network className="mr-2 h-4 w-4" />
                Knowledge Graph
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/exam"))}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Exam Simulator
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/dashboard"))}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Study Dashboard
              </CommandItem>
            </CommandGroup>

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
