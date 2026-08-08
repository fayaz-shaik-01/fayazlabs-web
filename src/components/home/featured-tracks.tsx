"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/section-header";
import { TrackCard } from "@/components/learning/track-card";
import { getAllTracks } from "@/lib/curriculum";

export function FeaturedTracks() {
  const tracks = getAllTracks().slice(0, 6);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <SectionHeader
        label="Learning Tracks"
        title="Pick Your Path"
        description="Structured tracks from math foundations to production AI — each lesson grounded in real engineering."
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track, index) => (
          <TrackCard key={track.id} track={track} index={index} />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10 flex justify-center"
      >
        <Link
          href="/learning"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "gap-2 rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400 text-sm font-semibold px-7 h-11"
          )}
        >
          View All Tracks
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
