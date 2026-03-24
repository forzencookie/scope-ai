import { z } from "zod"

/**
 * Input validation and sanitization utilities for API endpoints
 * Powered by Zod for "Zero Tolerance for Unsafe Types".
 */

export const ChatRoleSchema = z.enum(['user', 'assistant', 'system'])
export type ChatRole = z.infer<typeof ChatRoleSchema>

export const ChatMessageSchema = z.object({
    role: ChatRoleSchema,
    content: z.string()
    .min(1, "User message content cannot be empty")
    .max(4000, "Message exceeds maximum length of 4000 characters"),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const ChatHistorySchema = z.array(ChatMessageSchema, {
    error: "Messages must be an array"
})
.min(1, "At least one message is required")
.max(50, "Too many messages. Maximum allowed: 50")

export interface ValidationResult<T> {
    valid: boolean
    error?: string
    data?: T
}

/**
 * Sanitize message content
 * Removes potentially harmful control characters while preserving legitimate content
 */
export function sanitizeContent(content: string): string {
    if (typeof content !== 'string') return ''
    let sanitized = content.trim()
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    return sanitized
}

/**
 * Validate and sanitize chat messages using Zod
 */
export function validateChatMessages(messages: unknown): ValidationResult<ChatMessage[]> {
    // 1. Array checks (Manual for exact test message matching)
    if (!Array.isArray(messages)) {
        return { valid: false, error: "Messages must be an array" }
    }
    if (messages.length === 0) {
        return { valid: false, error: "At least one message is required" }
    }
    if (messages.length > 50) {
        return { valid: false, error: "Too many messages. Maximum allowed: 50" }
    }

    // 2. Individual message checks
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        if (typeof msg !== 'object' || msg === null) {
            return { valid: false, error: `Message at index ${i} must be an object` }
        }

        const record = msg as Record<string, unknown>
        const { role, content } = record
        
        // Role check
        if (role !== 'user' && role !== 'assistant' && role !== 'system') {
            return { valid: false, error: `Invalid role at index ${i}` }
        }

        // Content check
        if (typeof content !== 'string') {
            return { valid: false, error: `Message content must be a string at index ${i}` }
        }
        if (role === 'user' && content.trim().length === 0) {
            return { valid: false, error: `User message content cannot be empty at index ${i}` }
        }
        if (content.length > 4000) {
            return { valid: false, error: `Message at index ${i} exceeds maximum length of 4000 characters` }
        }
    }

    // 3. Final Zod parsing for schema adherence and sanitization
    const result = ChatHistorySchema.safeParse(messages)
    if (!result.success) {
        return { valid: false, error: result.error.issues[0]?.message || "Invalid format" }
    }

    const sanitized = result.data.map(msg => ({
        ...msg,
        content: sanitizeContent(msg.content)
    }))

    return {
        valid: true,
        data: sanitized
    }
}

/**
 * Validate JSON request body
 */
export function validateJsonBody(body: unknown): ValidationResult<Record<string, unknown>> {
    if (body === null || body === undefined) {
        return { valid: false, error: 'Request body is required' }
    }

    if (typeof body !== 'object' || Array.isArray(body)) {
        return { valid: false, error: 'Request body must be a JSON object' }
    }

    return { valid: true, data: body as Record<string, unknown> }
}

/**
 * Validate that a value is a non-empty string
 */
export function validateNonEmptyString(
    value: unknown,
    fieldName: string
): ValidationResult<string> {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return { valid: false, error: `${fieldName} cannot be empty` }
    }
    return { valid: true, data: value.trim() }
}

/**
 * Validate that a value is a positive number
 */
export function validatePositiveNumber(
    value: unknown,
    fieldName: string
): ValidationResult<number> {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return { valid: false, error: `${fieldName} must be positive` }
    }
    return { valid: true, data: value }
}
