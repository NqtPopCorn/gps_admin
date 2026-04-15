import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageUploadHandle {
  /** Clear preview & value */
  clear: () => void;
  /** Programmatically open file picker */
  open: () => void;
}

export interface ImageUploadProps {
  /** Controlled value – pass a URL string or File */
  value?: File | string | null;
  /** Called whenever user picks a new file */
  onChange?: (file: File) => void;
  /** Called when user removes the current image */
  onRemove?: () => void;
  /** Accept attribute forwarded to <input> */
  accept?: string;
  /** Max file size in bytes (default: 5 MB). Shows error if exceeded. */
  maxSize?: number;
  /** Aspect ratio class, e.g. "aspect-video" | "aspect-square" | "aspect-[4/3]" */
  aspectRatio?: string;
  /** Placeholder label shown when empty */
  label?: string;
  /** Extra class names on the root element */
  className?: string;
  /** Disable interaction */
  disabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPreviewUrl(value: File | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return URL.createObjectURL(value);
}

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6m4-6v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(function ImageUpload(
  {
    value,
    onChange,
    onRemove,
    accept = "image/*",
    maxSize = 5 * 1024 * 1024,
    aspectRatio = "aspect-video",
    label = "Upload image",
    className,
    disabled = false,
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uncontrolled preview fallback
  const previewSrc = internalFile ? toPreviewUrl(internalFile) : toPreviewUrl(value);

  const hasImage = Boolean(previewSrc);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    clear() {
      setInternalFile(null);
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    open() {
      inputRef.current?.click();
    },
  }));

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > maxSize) {
        setError(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)} MB.`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      setInternalFile(file);
      onChange?.(file);
    },
    [maxSize, onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={hasImage ? "Change image" : label}
        onClick={!hasImage ? handleClick : undefined}
        onKeyDown={(e) => e.key === "Enter" && !hasImage && handleClick()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border-2 transition-all duration-200 outline-none",
          aspectRatio,
          // Empty state
          !hasImage && [
            "border-dashed",
            isDragging ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-gray-200 bg-gray-50",
            !disabled && "cursor-pointer hover:border-blue-400 hover:bg-blue-50/50",
            disabled && "opacity-50 cursor-not-allowed",
          ],
          // Filled state
          hasImage && "border-transparent cursor-default",
        )}
      >
        {hasImage ? (
          /* ── Preview ── */
          <>
            <img src={previewSrc!} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />

            {/* Dark overlay on hover */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors duration-200 group flex items-center justify-center gap-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                  {/* Change button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold shadow-md hover:bg-white transition-colors"
                    title="Change image"
                  >
                    <EditIcon />
                    Change
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={handleRemove}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold shadow-md hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <TrashIcon />
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* File name chip — bottom left */}
            {internalFile && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-md">
                <p className="text-[10px] text-white font-medium max-w-[180px] truncate">{internalFile.name}</p>
              </div>
            )}
          </>
        ) : (
          /* ── Empty placeholder ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400",
              )}
            >
              <UploadIcon />
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "text-sm font-semibold transition-colors",
                  isDragging ? "text-blue-600" : "text-gray-600",
                )}
              >
                {isDragging ? "Drop to upload" : label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Drag & drop or <span className="text-blue-500 font-medium underline underline-offset-2">browse</span>
              </p>
              <p className="text-[10px] text-gray-300 mt-1">
                PNG, JPG, WEBP — max {Math.round(maxSize / 1024 / 1024)} MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5 px-1">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
});

export default ImageUpload;
