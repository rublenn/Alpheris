"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createImageUpload, finishImageUpload } from "@/actions/admin";

/**
 * Upload photos. Each file goes straight from the browser to Supabase Storage
 * using a one-time link from the server.
 */
export function ImageUploader({
  target,
  multiple = true,
  label = "Upload photos",
}: {
  target: { kind: "product" | "category"; id: string };
  multiple?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const list = Array.from(files).slice(0, 10);
    let done = 0;
    for (const file of list) {
      setStatus(`Uploading ${done + 1} of ${list.length}…`);
      const start = await createImageUpload(target, file.type, file.size);
      if ("error" in start && start.error) {
        setStatus(`${file.name}: ${start.error}`);
        setBusy(false);
        return;
      }
      const { signedUrl, path } = start as { signedUrl: string; path: string };
      const res = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, "x-upsert": "false" },
        body: file,
      });
      if (!res.ok) {
        setStatus(`${file.name}: upload failed (${res.status}). Please try again.`);
        setBusy(false);
        return;
      }
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const finish = await finishImageUpload(target, path, alt);
      if ("error" in finish && finish.error) {
        setStatus(`${file.name}: ${finish.error}`);
        setBusy(false);
        return;
      }
      done++;
    }
    setStatus(`${done} photo${done === 1 ? "" : "s"} uploaded.`);
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label
        className={`inline-flex h-10 cursor-pointer items-center border border-dashed border-accent/60 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep hover:bg-accent/10 ${busy ? "pointer-events-none opacity-50" : ""}`}
      >
        {busy ? "Uploading…" : label}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
      <span className="text-[12px] text-muted">JPG, PNG or WebP · max 5 MB each</span>
      {status && <p role="status" className="w-full text-[13px] text-ink">{status}</p>}
    </div>
  );
}
