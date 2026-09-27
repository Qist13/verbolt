import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageUp } from "lucide-react";

import "./ImageUpload.css";

interface ImageUploadProps {
    onImageSelect: (file: File) => void;
}

function ImageUpload({ onImageSelect }: ImageUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (!file) return;

            onImageSelect(file);
            setPreviewUrl(URL.createObjectURL(file));
        },
    });

    return (
        <div
            {...getRootProps()}
            className={`image-dropzone ${isDragActive ? "drag-active" : ""}`}
        >
            <input {...getInputProps()} />

            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="image-preview"
                />
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
                    <p className="image-dropzone-hint">PNG, JPG, or WebP</p>
                </>
            )}
        </div>
    );
}

export default ImageUpload;
