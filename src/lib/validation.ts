/**
 * Input validation and sanitization utilities for API endpoints
 */

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
    role: ChatRole
    content: string
}

export interface ValidationResult<T = ChatMessage[]> {
    valid: boolean
    error?: string
    data?: T
}

// Configuration constants
const VALIDATION_CONFIG = {
    /** Maximum allowed message length (in characters) */
    MAX_MESSAGE_LENGTH: 4000,
    /** Maximum number of messages in conversation history */
    MAX_MESSAGES: 50,
    /** Allowed roles for messages */
    ALLOWED_ROLES: new Set<string>(['user', 'assistant', 'system']),
} as const

/**
 * Sanitize message content
 * Removes potentially harmful control characters while preserving legitimate content
 */
export function sanitizeContent(content: string): string {
    if (!content) return ''

    // Trim whitespace
    let sanitized = content.trim()

    // Remove null bytes and other control characters (except newlines, tabs, and carriage returns)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // Note: We don't aggressively filter content to preserve legitimate use cases
    // The OpenAI API has its own content moderation

    return sanitized
}

/**
 * Validate a single chat message
 */
function validateSingleMessage(
    msg: unknown,
    index: number
): { valid: true; message: ChatMessage } | { valid: false; error: string } {
    // Check if message is an object
    if (typeof msg !== 'object' || msg === null) {
        return {
            valid: false,
            error: `Message at index ${index} must be an object`,
        }
    }

    const msgObj = msg as Record<string, unknown>

    // Validate role
    if (!('role' in msgObj) || typeof msgObj.role !== 'string') {
        return {
            valid: false,
            error: `Message at index ${index} must have a valid role`,
        }
    }

    if (!VALIDATION_CONFIG.ALLOWED_ROLES.has(msgObj.role)) {
        return {
            valid: false,
            error: `Invalid role "${msgObj.role}" at index ${index}. Allowed: user, assistant, system`,
        }
    }

    // Validate content
    if (!('content' in msgObj) || typeof msgObj.content !== 'string') {
        return {
            valid: false,
            error: `Message at index ${index} must have string content`,
        }
    }

    // Check content length
    if (msgObj.content.length > VALIDATION_CONFIG.MAX_MESSAGE_LENGTH) {
        return {
            valid: false,
            error: `Message at index ${index} exceeds maximum length of ${VALIDATION_CONFIG.MAX_MESSAGE_LENGTH} characters`,
        }
    }

    // Check for empty content (only for user messages)
    if (msgObj.role === 'user' && msgObj.content.trim().length === 0) {
        return {
            valid: false,
            error: `User message at index ${index} cannot be empty`,
        }
    }

    // Sanitize content
    const sanitizedContent = sanitizeContent(msgObj.content)

    return {
        valid: true,
        message: {
            role: msgObj.role as ChatRole,
            content: sanitizedContent,
        },
    }
}

/**
 * Validate and sanitize chat messages
 * @param messages - Array of chat messages to validate
 * @returns Validation result with sanitized messages if valid
 */
export function validateChatMessages(messages: unknown): ValidationResult<ChatMessage[]> {
    // Check if messages is an array
    if (!Array.isArray(messages)) {
        return {
            valid: false,
            error: 'Messages must be an array',
        }
    }

    // Check message count
    if (messages.length === 0) {
        return {
            valid: false,
            error: 'At least one message is required',
        }
    }

    if (messages.length > VALIDATION_CONFIG.MAX_MESSAGES) {
        return {
            valid: false,
            error: `Too many messages. Maximum allowed: ${VALIDATION_CONFIG.MAX_MESSAGES}`,
        }
    }

    const sanitizedMessages: ChatMessage[] = []

    for (let i = 0; i < messages.length; i++) {
        const result = validateSingleMessage(messages[i], i)

        if (!result.valid) {
            return {
                valid: false,
                error: result.error,
            }
        }

        sanitizedMessages.push(result.message)
    }

    return {
        valid: true,
        data: sanitizedMessages,
    }
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use validateChatMessages().data instead of .sanitizedMessages
 */
export function validateChatMessagesLegacy(messages: unknown): {
    valid: boolean
    error?: string
    sanitizedMessages?: ChatMessage[]
} {
    const result = validateChatMessages(messages)
    return {
        valid: result.valid,
        error: result.error,
        sanitizedMessages: result.data,
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
    if (typeof value !== 'string') {
        return { valid: false, error: `${fieldName} must be a string` }
    }

    const trimmed = value.trim()
    if (trimmed.length === 0) {
        return { valid: false, error: `${fieldName} cannot be empty` }
    }

    return { valid: true, data: trimmed }
}

/**
 * Validate that a value is a positive number
 */
export function validatePositiveNumber(
    value: unknown,
    fieldName: string
): ValidationResult<number> {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { valid: false, error: `${fieldName} must be a number` }
    }

    if (value <= 0) {
        return { valid: false, error: `${fieldName} must be positive` }
    }

    return { valid: true, data: value }
}
