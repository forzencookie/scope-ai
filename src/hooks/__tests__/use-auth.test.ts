/**
 * Tests for useAuth hook
 * 
 * Note: This file mocks the Supabase client to test the hook in isolation
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../use-auth'

// Mock the supabase-auth module
const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()
const mockSignInWithOAuth = jest.fn()
const mockGetCurrentUser = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockResetPassword = jest.fn()
const mockUpdatePassword = jest.fn()

jest.mock('@/lib/database/supabase-auth', () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
    signUp: (...args: unknown[]) => mockSignUp(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
    getCurrentUser: () => mockGetCurrentUser(),
    onAuthStateChange: (callback: (user: unknown) => void) => mockOnAuthStateChange(callback),
    resetPassword: (...args: unknown[]) => mockResetPassword(...args),
    updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
}))

describe('useAuth', () => {
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        
        // Default mock implementations
        mockGetCurrentUser.mockResolvedValue(null)
        mockOnAuthStateChange.mockReturnValue({
            unsubscribe: jest.fn(),
        })
    })

    describe('initialization', () => {
        it('should start with loading state', () => {
            const { result } = renderHook(() => useAuth())

            expect(result.current.loading).toBe(true)
            expect(result.current.user).toBeNull()
            expect(result.current.isAuthenticated).toBe(false)
        })

        it('should fetch current user on mount', async () => {
            mockGetCurrentUser.mockResolvedValue(mockUser)

            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(mockGetCurrentUser).toHaveBeenCalledTimes(1)
            expect(result.current.user).toEqual(mockUser)
            expect(result.current.isAuthenticated).toBe(true)
        })

        it('should set up auth state listener', async () => {
            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
            expect(typeof mockOnAuthStateChange.mock.calls[0][0]).toBe('function')
        })

        it('should clean up subscription on unmount', async () => {
            const unsubscribeMock = jest.fn()
            mockOnAuthStateChange.mockReturnValue({ unsubscribe: unsubscribeMock })

            const { unmount } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(mockOnAuthStateChange).toHaveBeenCalled()
            })

            unmount()

            expect(unsubscribeMock).toHaveBeenCalledTimes(1)
        })
    })

    describe('auth state changes', () => {
        it('should update user when auth state changes', async () => {
            let authCallback: ((user: unknown) => void) | null = null
            mockOnAuthStateChange.mockImplementation((callback) => {
                authCallback = callback
                return { unsubscribe: jest.fn() }
            })

            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            // Simulate auth state change
            act(() => {
                authCallback?.(mockUser)
            })

            expect(result.current.user).toEqual(mockUser)
            expect(result.current.isAuthenticated).toBe(true)
        })

        it('should handle sign out via auth state change', async () => {
            let authCallback: ((user: unknown) => void) | null = null
            mockOnAuthStateChange.mockImplementation((callback) => {
                authCallback = callback
                return { unsubscribe: jest.fn() }
            })
            mockGetCurrentUser.mockResolvedValue(mockUser)

            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.user).toEqual(mockUser)
            })

            // Simulate sign out via auth state change
            act(() => {
                authCallback?.(null)
            })

            expect(result.current.user).toBeNull()
            expect(result.current.isAuthenticated).toBe(false)
        })
    })

    describe('exported functions', () => {
        it('should expose signIn function', async () => {
            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(typeof result.current.signIn).toBe('function')
            await result.current.signIn('a@b.com', 'pass')
            expect(mockSignIn).toHaveBeenCalledWith('a@b.com', 'pass')
        })

        it('should expose signUp function', async () => {
            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(typeof result.current.signUp).toBe('function')
            await result.current.signUp('a@b.com', 'pass')
            expect(mockSignUp).toHaveBeenCalledWith('a@b.com', 'pass')
        })

        it('should expose signOut function', async () => {
            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(typeof result.current.signOut).toBe('function')
            await result.current.signOut()
            expect(mockSignOut).toHaveBeenCalled()
        })

        it('should expose signInWithOAuth function', async () => {
            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(typeof result.current.signInWithOAuth).toBe('function')
            await result.current.signInWithOAuth('google')
            expect(mockSignInWithOAuth).toHaveBeenCalledWith('google')
        })

        it('should expose resetPassword function', async () => {
            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(typeof result.current.resetPassword).toBe('function')
            await result.current.resetPassword('test@example.com')
            expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
        })

        it('should expose updatePassword function', async () => {
            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(typeof result.current.updatePassword).toBe('function')
            await result.current.updatePassword('newpass123')
            expect(mockUpdatePassword).toHaveBeenCalledWith('newpass123')
        })
    })

    describe('isAuthenticated', () => {
        it('should be false when user is null', async () => {
            mockGetCurrentUser.mockResolvedValue(null)

            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.isAuthenticated).toBe(false)
        })

        it('should be true when user exists', async () => {
            mockGetCurrentUser.mockResolvedValue(mockUser)

            const { result } = renderHook(() => useAuth())

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.isAuthenticated).toBe(true)
        })
    })
})
