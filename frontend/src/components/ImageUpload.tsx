import { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import { ImageUp, X } from "lucide-react";

import "./ImageUpload.css";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface ImageUploadProps {
    previewUrl: string | null;
    onImageSelect: (file: File) => void;
    onImageRemove: () => void;
    onError: (message: string) => void;
    disabled?: boolean;
}

function ImageUpload({
    previewUrl,
    onImageSelect,
    onImageRemove,
    onError,
    disabled = false,
}: ImageUploadProps) {
    const handleRejection = ([rejection]: FileRejection[]) => {
        const code = rejection?.errors[0]?.code;
        onError(
            code === "file-too-large"
                ? "That image is too large. The limit is 10 MB."
                : "That file isn't a supported image. Use PNG, JPG, or WebP.",
        );
    };

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        accept: { "image/png": [], "image/jpeg": [], "image/webp": [] },
        maxFiles: 1,
        maxSize: MAX_IMAGE_BYTES,
        disabled,
        // With a preview showing, clicking the image shouldn't reopen the picker
        noClick: previewUrl !== null,
        onDropAccepted: ([file]) => onImageSelect(file),
        onDropRejected: handleRejection,
    });

    // Paste a screenshot from the clipboard anywhere on the page
    useEffect(() => {
        if (disabled) return;

        const handlePaste = (event: ClipboardEvent) => {
            const item = Array.from(event.clipboardData?.items ?? []).find(
                (item) => item.type.startsWith("image/"),
            );
            const file = item?.getAsFile();
            if (!file) return;

            event.preventDefault();
            if (file.size > MAX_IMAGE_BYTES) {
                onError("That image is too large. The limit is 10 MB.");
                return;
            }
            // Clipboard images are all named "image.png"; give it a useful name
            onImageSelect(
                new File(
                    [file],
                    `pasted-${Date.now()}.${file.type.split("/")[1]}`,
                    {
                        type: file.type,
                    },
                ),
            );
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [disabled, onImageSelect, onError]);

    return (
        <div
            {...getRootProps()}
            className={`image-dropzone ${isDragActive ? "drag-active" : ""} ${previewUrl ? "has-preview" : ""}`}
        >
            <input {...getInputProps()} />

            {previewUrl ? (
                <>
                    <img
                        src={previewUrl}
                        alt="Selected preview"
                        className="image-preview"
                    />
                    <div className="image-preview-actions">
                        <button
                            type="button"
                            onClick={open}
                            disabled={disabled}
                        >
                            <ImageUp size={14} />
                            Replace
                        </button>
                        <button
                            type="button"
                            onClick={onImageRemove}
                            disabled={disabled}
                            aria-label="Remove image"
                        >
                            <X size={14} />
                            Remove
                        </button>
                    </div>
                    {isDragActive && (
                        <div className="image-drop-overlay">
                            Drop to replace the image
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="image-dropzone-icon">
                        <ImageUp size={24} />
                    </div>
                    <p className="image-dropzone-title">
                        {isDragActive
                            ? "Drop the image here"
                            : "Drag an image here, or click to select"}
                    </p>
                    <p className="image-dropzone-hint">
                        Or paste a screenshot with{" "}
                        <kbd>
                            {navigator.platform.toUpperCase().includes("MAC")
                                ? "⌘ V"
                                : "Ctrl V"}
                        </kbd>
                        {" · "}PNG, JPG, or WebP up to 10 MB
                    </p>
                </>
            )}
        </div>
    );
}

export default ImageUpload;
