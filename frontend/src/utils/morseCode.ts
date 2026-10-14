const MORSE_CODE_MAP: Record<string, string> = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
    "0": "-----",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    ".": ".-.-.-",
    ",": "--..--",
    "?": "..--..",
    "'": ".----.",
    "!": "-.-.--",
    "/": "-..-.",
    "(": "-.--.",
    ")": "-.--.-",
    "&": ".-...",
    ":": "---...",
    ";": "-.-.-.",
    "=": "-...-",
    "+": ".-.-.",
    "-": "-....-",
    _: "..--.-",
    '"': ".-..-.",
    $: "...-..-",
    "@": ".--.-.",
};

const DECODE_MORSE_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(MORSE_CODE_MAP).map(([letter, code]) => [code, letter]),
);

export function encodeToMorse(text: string): string {
    return (
        text
            .trim()
            .toUpperCase()
            .split(/\s+/)
            .filter(Boolean)
            .map((word) =>
                word
                    .split("")
                    // characters that don't have a Morse code representation are set to '?'
                    .map((char) => MORSE_CODE_MAP[char] ?? "?")
                    .join(" "),
            )
            // '/' separates words in Morse
            .join(" / ")
    );
}

export function decodeFromMorse(morse: string): string {
    return (
        morse
            // Accept the look-alike characters people paste in
            .replace(/[•·∙]/g, ".")
            .replace(/[_−–—]/g, "-")
            .trim()
            // Words are separated by '/' or '|', letters by whitespace
            .split(/\s*[/|]\s*|\n+/)
            .filter(Boolean)
            .map((word) =>
                word
                    .split(/\s+/)
                    .map((code) => DECODE_MORSE_MAP[code] ?? "?")
                    .join(""),
            )
            .join(" ")
    );
}

/** True if the text only contains Morse symbols, so it's probably meant to be decoded. */
export function looksLikeMorse(text: string): boolean {
    return /^[\s.\-/|•·∙_−–—]+$/.test(text) && /[.\-•·∙_−–—]/.test(text);
}
