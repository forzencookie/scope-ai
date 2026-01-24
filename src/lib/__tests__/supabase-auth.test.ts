/**
 * Tests for supabase-auth module
 * 
 * Note: This mocks the Supabase client to test auth functions in isolation
 */

// Mock Supabase client
const mockSignUp = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockSignInWithOAuth = jest.fn()
const mockSignOut = jest.fn()
const mockGetUser = jest.fn()
const mockGetSession = jest.fn()
const mockResetPasswordForEmail = jest.fn()
const mockUpdateUser = jest.fn()
const mockOnAuthStateChange = jest.fn()

jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signUp: (...args: unknown[]) => mockSignUp(...args),
            signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
            signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
            signOut: () => mockSignOut(),
            getUser: () => mockGetUser(),
            getSession: () => mockGetSession(),
            resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
            updateUser: (...args: unknown[]) => mockUpdateUser(...args),
            onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
        },
    },
}))

import {
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    getCurrentUser,
    getSession,
    resetPassword,
    updatePassword,
    onAuthStateChange,
} from '../database/supabase-auth'

describe('Supabase Auth Functions', () => {
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
    }

    const mockSession = {
        access_token: 'mock-token',
        user: mockUser,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('signUp', () => {
        it('should call supabase signUp with email and password', async () => {
            mockSignUp.mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            })

            const result = await signUp('test@example.com', 'password123')

            expect(mockSignUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            })
            expect(result.user).toEqual(mockUser)
            expect(result.session).toEqual(mockSession)
            expect(result.error).toBeNull()
        })

        it('should return error on failed signup', async () => {
            const mockError = { message: 'Email already registered' }
            mockSignUp.mockResolvedValue({
                data: { user: null, session: null },
                error: mockError,
            })

            const result = await signUp('test@example.com', 'password123')

            expect(result.user).toBeNull()
            expect(result.error).toEqual(mockError)
        })
    })

    describe('signIn', () => {
        it('should call supabase signInWithPassword', async () => {
            mockSignInWithPassword.mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            })

            const result = await signIn('test@example.com', 'password123')

            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            })
            expect(result.user).toEqual(mockUser)
            expect(result.error).toBeNull()
        })

        it('should return error on failed signin', async () => {
            const mockError = { message: 'Invalid credentials' }
            mockSignInWithPassword.mockResolvedValue({
                data: { user: null, session: null },
                error: mockError,
            })

            const result = await signIn('test@example.com', 'wrongpassword')

            expect(result.error).toEqual(mockError)
        })
    })

    describe('signInWithOAuth', () => {
        beforeEach(() => {
            // Mock window.location
            Object.defineProperty(window, 'location', {
                value: { origin: 'http://localhost:3000' },
                writable: true,
            })
        })

        it('should call supabase signInWithOAuth with provider', async () => {
            mockSignInWithOAuth.mockResolvedValue({
                data: { provider: 'google', url: 'https://google.com/oauth' },
                error: null,
            })

            const result = await signInWithOAuth('google')

            expect(mockSignInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: 'http://localhost:3000/auth/callback',
                },
            })
            expect(result.data).toBeDefined()
            expect(result.error).toBeNull()
        })

        it('should support multiple OAuth providers', async () => {
            mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

            await signInWithOAuth('github')
            expect(mockSignInWithOAuth).toHaveBeenCalledWith(
                expect.objectContaining({ provider: 'github' })
            )

            await signInWithOAuth('azure')
            expect(mockSignInWithOAuth).toHaveBeenCalledWith(
                expect.objectContaining({ provider: 'azure' })
            )
        })
    })

    describe('signOut', () => {
        it('should call supabase signOut', async () => {
            mockSignOut.mockResolvedValue({ error: null })

            const result = await signOut()

            expect(mockSignOut).toHaveBeenCalled()
            expect(result.error).toBeNull()
        })

        it('should return error on failed signout', async () => {
            const mockError = { message: 'Session not found' }
            mockSignOut.mockResolvedValue({ error: mockError })

            const result = await signOut()

            expect(result.error).toEqual(mockError)
        })
    })

    describe('getCurrentUser', () => {
        it('should return current user', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: mockUser },
            })

            const user = await getCurrentUser()

            expect(mockGetUser).toHaveBeenCalled()
            expect(user).toEqual(mockUser)
        })

        it('should return null when no user', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: null },
            })

            const user = await getCurrentUser()

            expect(user).toBeNull()
        })
    })

    describe('getSession', () => {
        it('should return current session', async () => {
            mockGetSession.mockResolvedValue({
                data: { session: mockSession },
            })

            const session = await getSession()

            expect(mockGetSession).toHaveBeenCalled()
            expect(session).toEqual(mockSession)
        })

        it('should return null when no session', async () => {
            mockGetSession.mockResolvedValue({
                data: { session: null },
            })

            const session = await getSession()

            expect(session).toBeNull()
        })
    })

    describe('resetPassword', () => {
        beforeEach(() => {
            Object.defineProperty(window, 'location', {
                value: { origin: 'http://localhost:3000' },
                writable: true,
            })
        })

        it('should send password reset email', async () => {
            mockResetPasswordForEmail.mockResolvedValue({
                data: {},
                error: null,
            })

            const result = await resetPassword('test@example.com')

            expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
                'test@example.com',
                { redirectTo: 'http://localhost:3000/auth/reset-password' }
            )
            expect(result.error).toBeNull()
        })
    })

    describe('updatePassword', () => {
        it('should update user password', async () => {
            mockUpdateUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            })

            const result = await updatePassword('newPassword123')

            expect(mockUpdateUser).toHaveBeenCalledWith({
                password: 'newPassword123',
            })
            expect(result.error).toBeNull()
        })
    })

    describe('onAuthStateChange', () => {
        it('should set up auth state listener', () => {
            const mockCallback = jest.fn()
            const mockUnsubscribe = jest.fn()
            
            mockOnAuthStateChange.mockReturnValue({
                data: {
                    subscription: { unsubscribe: mockUnsubscribe }
                }
            })

            const subscription = onAuthStateChange(mockCallback)

            expect(mockOnAuthStateChange).toHaveBeenCalled()
            expect(subscription).toHaveProperty('unsubscribe')
        })

        it('should call callback with user from session', () => {
            let authCallback: (event: string, session: { user: typeof mockUser } | null) => void
            
            mockOnAuthStateChange.mockImplementation((callback) => {
                authCallback = callback
                return {
                    data: {
                        subscription: { unsubscribe: jest.fn() }
                    }
                }
            })

            const userCallback = jest.fn()
            onAuthStateChange(userCallback)

            // Simulate auth event
            authCallback!('SIGNED_IN', { user: mockUser })

            expect(userCallback).toHaveBeenCalledWith(mockUser)
        })

        it('should call callback with null when session is null', () => {
            let authCallback: (event: string, session: null) => void
            
            mockOnAuthStateChange.mockImplementation((callback) => {
                authCallback = callback
                return {
                    data: {
                        subscription: { unsubscribe: jest.fn() }
                    }
                }
            })

            const userCallback = jest.fn()
            onAuthStateChange(userCallback)

            // Simulate sign out event
            authCallback!('SIGNED_OUT', null)

            expect(userCallback).toHaveBeenCalledWith(null)
        })
    })
})
