"use client"

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // Initialize lazily to avoid effect update
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue
        }
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error(error)
            return initialValue
        }
    })

    // No need for Effect to read on mount anymore as we do it lazily above.
    // However, if key changes, we might want to re-read (though unusual use pattern).
    // The current pattern was "Read on mount ONLY", not on key change (dep array was [key]).
    // The previous code had a bug: if key changed, it would read new value but only update `storedValue`.
    
    // We'll keep it simple: Just lazy init.


    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
        } catch (error) {
            console.error(error)
        }
    }

    return [storedValue, setValue]
}
