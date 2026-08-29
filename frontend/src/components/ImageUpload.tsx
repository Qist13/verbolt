import { useState } from "react";
import { useDropzone } from "react-dropzone";

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
        <div {...getRootProps()} className="image-dropzone">
            <input {...getInputProps()} />

            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="image-preview"
                />
            ) : isDragActive ? (
                <p>Drop the image here</p>
            ) : (
                <p>Drag an image here, or click to select</p>
            )}
        </div>
    );
}

export default ImageUpload;
