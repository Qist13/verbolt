export interface TimedText {
    start: number;
    end: number;
    text: string;
}

/** 75.4 -> "1:15", 3725 -> "1:02:05" */
export function formatTimestamp(seconds: number): string {
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, "0");
    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
        : `${minutes}:${secs}`;
}

/** 75.4 -> "00:01:15,400" */
function formatSrtTime(seconds: number): string {
    const ms = Math.round(seconds * 1000);
    const pad = (value: number, length = 2) =>
        String(value).padStart(length, "0");
    return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

/** Builds an .srt subtitle file, which video players can load alongside a video. */
export function toSrt(lines: TimedText[]): string {
    return lines
        .map(
            (line, index) =>
                `${index + 1}\n${formatSrtTime(line.start)} --> ${formatSrtTime(line.end)}\n${line.text}\n`,
        )
        .join("\n");
}
