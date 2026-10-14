import { useEffect, useRef, useState } from "react";

/** Records from the microphone and hands back the recording as a File. */
function useRecorder(onRecorded: (file: File) => void) {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<number | null>(null);

    const stopTimer = () => {
        if (timerRef.current !== null) clearInterval(timerRef.current);
        timerRef.current = null;
    };

    const start = async () => {
        // Throws if there's no microphone or permission is denied
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => chunks.push(event.data);
        recorder.onstop = () => {
            stream.getTracks().forEach((track) => track.stop());
            stopTimer();
            setIsRecording(false);

            // Chrome and Firefox record WebM, Safari MP4
            const type = recorder.mimeType || "audio/webm";
            const extension = type.includes("mp4") ? "m4a" : "webm";
            const blob = new Blob(chunks, { type });
            if (blob.size > 0) {
                onRecorded(
                    new File([blob], `recording-${Date.now()}.${extension}`, {
                        type,
                    }),
                );
            }
        };

        recorder.start();
        recorderRef.current = recorder;
        setIsRecording(true);
        setElapsedSeconds(0);
        timerRef.current = window.setInterval(
            () => setElapsedSeconds((seconds) => seconds + 1),
            1000,
        );
    };

    const stop = () => {
        if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();
        }
    };

    // Release the microphone if the component unmounts mid-recording
    useEffect(
        () => () => {
            const recorder = recorderRef.current;
            if (recorder?.state === "recording") {
                recorder.onstop = null;
                recorder.stop();
                recorder.stream.getTracks().forEach((track) => track.stop());
            }
            stopTimer();
        },
        [],
    );

    return { isRecording, elapsedSeconds, start, stop };
}

export default useRecorder;
