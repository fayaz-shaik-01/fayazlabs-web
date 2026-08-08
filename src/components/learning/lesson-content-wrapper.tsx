"use client";

import { LessonModeProvider, LessonModeSelector } from "@/components/learning/lesson-mode-selector";
import { NotesSidebar } from "@/components/learning/notes-sidebar";

interface LessonContentWrapperProps {
  children: React.ReactNode;
  lessonKey?: string;
  lessonTitle?: string;
}

export function LessonContentWrapper({ children, lessonKey, lessonTitle }: Readonly<LessonContentWrapperProps>) {
  return (
    <LessonModeProvider>
      <div className="mb-6">
        <LessonModeSelector />
      </div>
      {children}
      {lessonKey && lessonTitle && (
        <NotesSidebar lessonKey={lessonKey} lessonTitle={lessonTitle} />
      )}
    </LessonModeProvider>
  );
}
