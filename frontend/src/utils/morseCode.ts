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
};

const DECODE_MORSE_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(MORSE_CODE_MAP).map(([letter, code]) => [code, letter]),
);

export function encodeToMorse(text: string): string {
    return text
        .toUpperCase()
        .split("")
        .map((char) => {
            // '/' separates words in Morse
            if (char === " ") return "/";

            // characters that don't have a Morse code representation is set to '?'
            return MORSE_CODE_MAP[char] ?? "?";
        })
        .join(" ");
}

export function decodeFromMorse(morse: string): string {
    return morse
        .trim()
        .split(" ")
        .map((code) => {
            if (code === "/") return " ";

            return DECODE_MORSE_MAP[code] ?? "?";
        })
        .join("");
}
