/**
 * Tests for input validation utilities
 */
import {
    sanitizeContent,
    validateChatMessages,
    validateJsonBody,
    type ChatMessage,
} from '../validation'

describe('sanitizeContent', () => {
    it('should return empty string for null/undefined input', () => {
        expect(sanitizeContent('')).toBe('')
        expect(sanitizeContent(null as unknown as string)).toBe('')
        expect(sanitizeContent(undefined as unknown as string)).toBe('')
    })

    it('should trim whitespace from content', () => {
        expect(sanitizeContent('  hello  ')).toBe('hello')
        expect(sanitizeContent('\n\nhello\n\n')).toBe('hello')
        expect(sanitizeContent('\t\thello\t\t')).toBe('hello')
    })

    it('should remove control characters', () => {
        expect(sanitizeContent('hello\x00world')).toBe('helloworld')
        expect(sanitizeContent('test\x08string')).toBe('teststring')
        expect(sanitizeContent('abc\x1Fdef')).toBe('abcdef')
    })

    it('should preserve legitimate whitespace characters', () => {
        expect(sanitizeContent('hello\nworld')).toBe('hello\nworld')
        expect(sanitizeContent('hello\tworld')).toBe('hello\tworld')
        expect(sanitizeContent('hello\rworld')).toBe('hello\rworld')
    })

    it('should handle mixed content correctly', () => {
        const input = '  hello\x00\nworld  '
        expect(sanitizeContent(input)).toBe('hello\nworld')
    })
})

describe('validateChatMessages', () => {
    it('should validate correct messages', () => {
        const messages: ChatMessage[] = [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
        ]
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(true)
        expect(result.data).toHaveLength(2)
    })

    it('should reject non-array input', () => {
        const result = validateChatMessages('not an array' as unknown as ChatMessage[])
        expect(result.valid).toBe(false)
        expect(result.error).toContain('array')
    })

    it('should reject empty array', () => {
        const result = validateChatMessages([])
        expect(result.valid).toBe(false)
        expect(result.error).toContain('at least one message')
    })

    it('should reject messages with invalid role', () => {
        const messages = [
            { role: 'invalid' as 'user', content: 'Hello' },
        ]
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('role')
    })

    it('should reject messages with non-string content', () => {
        const messages = [
            { role: 'user', content: 123 as unknown as string },
        ]
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('content')
    })

    it('should reject messages with empty content', () => {
        const messages: ChatMessage[] = [
            { role: 'user', content: '' },
        ]
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('empty')
    })

    it('should reject messages exceeding max length', () => {
        const longContent = 'a'.repeat(5000)
        const messages: ChatMessage[] = [
            { role: 'user', content: longContent },
        ]
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('too long')
    })

    it('should reject too many messages', () => {
        const messages: ChatMessage[] = Array.from({ length: 60 }, () => ({
            role: 'user' as const,
            content: 'test',
        }))
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Too many messages')
    })

    it('should sanitize message content', () => {
        const messages: ChatMessage[] = [
            { role: 'user', content: '  hello\x00world  ' },
        ]
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(true)
        expect(result.data?.[0].content).toBe('helloworld')
    })

    it('should accept all valid roles', () => {
        const messages: ChatMessage[] = [
            { role: 'system', content: 'System message' },
            { role: 'user', content: 'User message' },
            { role: 'assistant', content: 'Assistant message' },
        ]
        const result = validateChatMessages(messages)
        expect(result.valid).toBe(true)
    })
})

describe('validateJsonBody', () => {
    it('should validate correct JSON object', () => {
        const result = validateJsonBody({ messages: [{ role: 'user', content: 'Hello' }] })
        expect(result.valid).toBe(true)
        expect(result.data).toBeDefined()
    })

    it('should reject null body', () => {
        const result = validateJsonBody(null)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('required')
    })

    it('should reject undefined body', () => {
        const result = validateJsonBody(undefined)
        expect(result.valid).toBe(false)
    })

    it('should reject array body', () => {
        const result = validateJsonBody([{ role: 'user', content: 'Hello' }])
        expect(result.valid).toBe(false)
        expect(result.error).toContain('object')
    })

    it('should reject primitive values', () => {
        expect(validateJsonBody('string').valid).toBe(false)
        expect(validateJsonBody(123).valid).toBe(false)
        expect(validateJsonBody(true).valid).toBe(false)
    })

    it('should accept empty objects', () => {
        const result = validateJsonBody({})
        expect(result.valid).toBe(true)
    })
})
