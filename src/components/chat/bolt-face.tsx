import { cn } from "@/lib/utils";
import type { OrbStatus } from "@/stores/chat-store";

/** The small CSS robot face: chat avatar, launcher, and the stand-in when the 3D scene is off. */
export function BoltFace({ status = "idle", className }: Readonly<{ status?: OrbStatus; className?: string }>) {
  return (
    <span aria-hidden="true" data-status={status} className={cn("bolt-face", className)}>
      <i />
      <i />
    </span>
  );
}
