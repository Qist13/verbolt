// Standard Morse timing: a dash is 3 dots, gaps between letters are 3 dots
// and gaps between words are 7 dots.
const DOT_SECONDS = 0.07;
const TONE_HZ = 600;

/**
 * Plays Morse code ("... --- ... / ...") as beeps.
 * Returns a function that stops playback, and calls `onEnd` when finished.
 */
export function playMorse(morse: string, onEnd: () => void): () => void {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.frequency.value = TONE_HZ;
    gain.gain.value = 0;
    oscillator.connect(gain).connect(context.destination);

    let time = context.currentTime + 0.05;
    const beep = (dots: number) => {
        // Short ramps avoid clicks at the start and end of each tone
        gain.gain.setTargetAtTime(0.25, time, 0.004);
        time += dots * DOT_SECONDS;
        gain.gain.setTargetAtTime(0, time, 0.004);
        time += DOT_SECONDS;
    };

    for (const symbol of morse.trim()) {
        if (symbol === ".") beep(1);
        else if (symbol === "-") beep(3);
        // One dot of gap already follows every beep
        else if (symbol === " ") time += 2 * DOT_SECONDS;
        else if (symbol === "/") time += 2 * DOT_SECONDS;
    }

    oscillator.start();
    oscillator.stop(time);

    let stopped = false;
    const stop = () => {
        if (stopped) return;
        stopped = true;
        oscillator.onended = null;
        context.close();
        onEnd();
    };
    oscillator.onended = stop;

    return stop;
}
