"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadFile } from "@/lib/upload-client";

export type ListingImageInput = { url: string; kind: "PHOTO" | "DYE_LOT_LABEL" };

export function ImageUploader({
  images,
  onChange,
}: {
  images: ListingImageInput[];
  onChange: (images: ListingImageInput[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null, kind: ListingImageInput["kind"]) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded: ListingImageInput[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, "listings");
        uploaded.push({ url, kind });
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function remove(url: string) {
    onChange(images.filter((img) => img.url !== url));
  }

  const photos = images.filter((i) => i.kind === "PHOTO");
  const dyeLotPhotos = images.filter((i) => i.kind === "DYE_LOT_LABEL");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">Photos</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((img) => (
            <Thumb key={img.url} url={img.url} onRemove={() => remove(img.url)} />
          ))}
          <UploadTile disabled={busy} onFiles={(files) => handleFiles(files, "PHOTO")} label="Add photos" />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">
          Box label / dye-lot photo <span className="font-normal text-slate-500">(recommended)</span>
        </p>
        <p className="text-xs text-slate-500">
          This is the provenance proof buyers check most closely — a clear photo of the box label or run
          tag builds trust even when there's no dye lot number on file.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {dyeLotPhotos.map((img) => (
            <Thumb key={img.url} url={img.url} onRemove={() => remove(img.url)} />
          ))}
          {dyeLotPhotos.length === 0 && (
            <UploadTile
              disabled={busy}
              onFiles={(files) => handleFiles(files, "DYE_LOT_LABEL")}
              label="Add dye-lot photo"
            />
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Thumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-md border border-slate-200">
      <Image src={url} alt="" fill sizes="96px" className="object-cover" unoptimized />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-0 top-0 rounded-bl bg-black/60 px-1.5 text-xs text-white"
      >
        ×
      </button>
    </div>
  );
}

function UploadTile({
  onFiles,
  disabled,
  label,
}: {
  onFiles: (files: FileList | null) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 text-center text-xs text-slate-500 hover:bg-slate-50">
      {label}
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </label>
  );
}
