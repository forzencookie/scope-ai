import { NextResponse } from 'next/server';
import ical, { ICalCalendarMethod } from 'ical-generator';
import { getRoadmaps } from '@/services/roadmap-service'; // NOTE: This will require service to work on server (it does)

export async function GET(request: Request) {
    // In a real app, we would validate the 'userId' or 'token' query param
    // const { searchParams } = new URL(request.url);
    // const token = searchParams.get('token');

    const calendar = ical({
        name: 'Scope AI - Viktiga Datum',
        method: ICalCalendarMethod.PUBLISH,
        scale: 'GREGORIAN',
        url: 'https://scope-ai.se', // Your app URL
        ttl: 3600, // Check for updates every hour
    });

    const currentYear = new Date().getFullYear();

    // 1. Static Tax Events (Always present)
    calendar.createEvent({
        start: new Date(currentYear, 4, 12, 9, 0), // May 12
        end: new Date(currentYear, 4, 12, 10, 0),
        summary: 'Momsdeklaration Q1',
        description: 'Sista dag att lämna och betala moms för Q1 (jan-mars).',
        url: 'https://scope-ai.se/rapporter/moms'
    });

    // 2. Dynamic Roadmap Events (From DB)
    try {
        const roadmaps = await getRoadmaps();

        roadmaps.forEach(roadmap => {
            if (roadmap.status === 'archived') return;

            roadmap.steps?.forEach(step => {
                // Only add if it has a due date and isn't completed/skipped
                if (step.due_date && step.status !== 'completed' && step.status !== 'skipped') {
                    const date = new Date(step.due_date);
                    // Standard 1 hour duration
                    const endDate = new Date(date);
                    endDate.setHours(date.getHours() + 1);

                    calendar.createEvent({
                        start: date,
                        end: endDate,
                        summary: step.title, // e.g. "Skicka in Bolagsverket-anmälan"
                        description: `Del av plan: ${roadmap.title}\n\n${step.description || ''}`,
                        url: `https://scope-ai.se/handelser?roadmap=${roadmap.id}`,
                    });
                }
            });
        });
    } catch (error) {
        // Fallback or log error, but still return static calendar
        console.error("Failed to fetch roadmaps for calendar", error);
    }

    // 3. Payroll (Static example, could also be dynamic)
    const nextPayDay = new Date();
    nextPayDay.setDate(25);
    if (nextPayDay < new Date()) {
        nextPayDay.setMonth(nextPayDay.getMonth() + 1);
    }

    calendar.createEvent({
        start: new Date(nextPayDay.getFullYear(), nextPayDay.getMonth(), 25, 10, 0),
        end: new Date(nextPayDay.getFullYear(), nextPayDay.getMonth(), 25, 11, 0),
        summary: 'Löneutbetalning',
        description: 'Dags att betala ut lönerna.',
        url: 'https://scope-ai.se/loner'
    });

    return new NextResponse(calendar.toString(), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="scope-ai-calendar.ics"',
        },
    });
}
