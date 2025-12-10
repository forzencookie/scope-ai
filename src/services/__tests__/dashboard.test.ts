/**
 * Tests for dashboard service
 */
import {
    getDashboardData,
    getQuickStats,
    getPendingTasks,
    getRecentActivity,
    getQuickLinks,
    refreshQuickStats,
} from '../dashboard'

describe('Dashboard Service', () => {
    describe('getDashboardData', () => {
        it('should return dashboard data successfully', async () => {
            const result = await getDashboardData()

            expect(result.success).toBe(true)
            expect(result.data).toBeDefined()
            expect(result.timestamp).toBeInstanceOf(Date)
        })

        it('should include all required dashboard sections', async () => {
            const result = await getDashboardData()

            expect(result.data).toHaveProperty('quickStats')
            expect(result.data).toHaveProperty('pendingTasks')
            expect(result.data).toHaveProperty('recentActivity')
            expect(result.data).toHaveProperty('quickLinks')
        })
    })

    describe('getQuickStats', () => {
        it('should return quick stats array', async () => {
            const result = await getQuickStats()

            expect(result.success).toBe(true)
            expect(Array.isArray(result.data)).toBe(true)
            expect(result.timestamp).toBeInstanceOf(Date)
        })

        it('should return stats with required properties', async () => {
            const result = await getQuickStats()

            if (result.data && result.data.length > 0) {
                const stat = result.data[0]
                // Check for actual properties in the mock data
                expect(stat).toHaveProperty('id')
                expect(stat).toHaveProperty('label')
                expect(stat).toHaveProperty('value')
            }
        })
    })

    describe('refreshQuickStats', () => {
        it('should return refreshed stats', async () => {
            const result = await refreshQuickStats()

            expect(result.success).toBe(true)
            expect(Array.isArray(result.data)).toBe(true)
        })
    })

    describe('getPendingTasks', () => {
        it('should return pending tasks array', async () => {
            const result = await getPendingTasks()

            expect(result.success).toBe(true)
            expect(Array.isArray(result.data)).toBe(true)
        })

        it('should return tasks with required properties', async () => {
            const result = await getPendingTasks()

            if (result.data && result.data.length > 0) {
                const task = result.data[0]
                expect(task).toHaveProperty('id')
                expect(task).toHaveProperty('title')
            }
        })
    })

    describe('getRecentActivity', () => {
        it('should return recent activity array', async () => {
            const result = await getRecentActivity()

            expect(result.success).toBe(true)
            expect(Array.isArray(result.data)).toBe(true)
        })

        it('should return activities with required properties', async () => {
            const result = await getRecentActivity()

            if (result.data && result.data.length > 0) {
                const activity = result.data[0]
                expect(activity).toHaveProperty('id')
                // Check for actual properties in the mock data
                expect(activity).toHaveProperty('action')
                expect(activity).toHaveProperty('item')
            }
        })
    })

    describe('getQuickLinks', () => {
        it('should return quick links array', async () => {
            const result = await getQuickLinks()

            expect(result.success).toBe(true)
            expect(Array.isArray(result.data)).toBe(true)
        })

        it('should return links with required properties', async () => {
            const result = await getQuickLinks()

            if (result.data && result.data.length > 0) {
                const link = result.data[0]
                // Check for actual properties in the mock data
                expect(link).toHaveProperty('id')
                expect(link).toHaveProperty('label')
                expect(link).toHaveProperty('href')
            }
        })
    })
})
