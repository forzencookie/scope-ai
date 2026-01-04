/**
 * Chat utility functions
 * Extracted from ai-robot/page.tsx for reusability
 */

import type { Message } from './chat-types'

/**
 * Generate a conversation title from the first user message
 */
export function generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return 'Ny konversation'
    const title = firstUserMessage.content.slice(0, 40)
    return title.length < firstUserMessage.content.length ? `${title}...` : title
}

/**
 * Get a Swedish greeting based on time of day
 */
export function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 5) return 'God natt'
    if (hour < 10) return 'Godmorgon'
    if (hour < 13) return 'God förmiddag'
    if (hour < 18) return 'God eftermiddag'
    return 'God kväll'
}

/**
 * Convert a File to a base64 data URL (includes data: prefix)
 * Used for displaying images in the UI
 */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Convert a File to base64 for API transmission
 * Returns object with name, type, and raw base64 data (no prefix)
 */
export function fileToBase64(file: File): Promise<{ name: string; type: string; data: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve({ name: file.name, type: file.type, data: base64 })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
