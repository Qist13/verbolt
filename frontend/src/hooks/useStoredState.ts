import { useState, useEffect } from "react";

/** useState that's remembered in localStorage across visits. */
function useStoredState<T>(key: string, initialValue: T | (() => T)) {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored !== null) return JSON.parse(stored) as T;
        } catch {
            // Storage blocked or value corrupted: fall back to the default
        }
        return initialValue instanceof Function ? initialValue() : initialValue;
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Storage blocked (private mode): the value just won't persist
        }
    }, [key, value]);

    return [value, setValue] as const;
}

export default useStoredState;
