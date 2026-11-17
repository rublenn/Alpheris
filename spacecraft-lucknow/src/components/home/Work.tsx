"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { categories } from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Proof of work + clients.
 * EVERYTHING HERE IS A PLACEHOLDER: the project types come from the services
 * listed on the current Space Craft website, but there are no real project
 * photos, client names or logos yet. Replace them once supplied (and only
 * show client logos with the client's permission).
 */
const projects = [
  { type: "Home interiors", look: "louvers" },
  { type: "Modular kitchens", look: "acrylic-laminates" },
  { type: "Bedroom & wardrobes", look: "laminates" },
  { type: "Office interiors", look: "charcoal-panels" },
  { type: "Commercial fit-outs", look: "uv-marble-sheets" },
  { type: "Wall panelling", look: "wall-panels" },
];

const clientSlots = 8;

export function Work() {
  const frame = useRef<HTMLDivElement>(null);

  return (
    <section id="work" className="overflow-hidden py-24 lg:py-36">
      <div className="shell">
        <SectionHeader index="05" eyebrow="Proof of work" title="Spaces our *materials* shaped.">
          Drag to browse projects.
          <span className="mt-3 block text-[13px] text-accent-deep">
            Placeholder project cards — real project photos will be added here.
          </span>
        </SectionHeader>
      </div>

      {/* Draggable row of project cards */}
      <div ref={frame} className="shell mt-14">
        <motion.ul
          drag="x"
          dragConstraints={frame}
          dragElastic={0.08}
          data-cursor="Drag"
          className="flex w-max cursor-grab gap-5 active:cursor-grabbing"
        >
          {projects.map((project, i) => {
            const swatch = categories.find((c) => c.slug === project.look)!.swatch;
            return (
              <motion.li
                key={project.type}
                initial={{ opacity: 0, y: 40, rotateY: -12 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.9, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="group relative w-[78vw] max-w-[380px] select-none [perspective:1000px] sm:w-[340px]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                  <MaterialSwatch
                    swatch={swatch}
                    className="pointer-events-none transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 bg-white/90 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink">
                    Sample project
                  </span>
                  <div className="absolute inset-x-5 bottom-5 text-[#fff]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#fff]/75">
                      {String(i + 1).padStart(2, "0")} · Photos coming soon
                    </p>
                    <h3 className="display mt-2 text-[1.9rem] leading-tight !text-[#fff]">{project.type}</h3>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      {/* Clients */}
      <div className="shell mt-24 lg:mt-32">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line pt-10">
            <div>
              <p className="eyebrow">Our clients</p>
              <h3 className="display mt-3 text-[clamp(1.9rem,3.6vw,3rem)]">Who we work with.</h3>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-muted">
              Homeowners, architects, designers and contractors.
              <span className="mt-2 block text-[13px] text-accent-deep">
                Placeholder tiles — client logos will be added with their permission.
              </span>
            </p>
          </div>
        </Reveal>
        <ul className="mt-10 grid grid-cols-2 border-l border-t border-line sm:grid-cols-4">
          {Array.from({ length: clientSlots }, (_, i) => (
            <li key={i} className="group relative border-b border-r border-line">
              <Reveal delay={(i % 4) * 0.06}>
                <div className="flex aspect-[3/2] items-center justify-center">
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-white transition-transform duration-700 ease-luxe group-hover:scale-y-100" />
                  <span className="display relative text-[1.3rem] text-ink/35 transition-colors duration-500 group-hover:text-ink">
                    Client {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
