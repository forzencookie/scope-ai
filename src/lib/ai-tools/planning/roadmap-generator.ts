// @ts-nocheck

import { z } from "zod"
import { createRoadmap } from "@/services/roadmap-service"

export const generateRoadmapTool = {
    name: "generate_roadmap",
    description: "Generate a structured step-by-step roadmap for a business goal (e.g., 'Start a company', 'Close fiscal year'). Creates a persistent plan in the database.",
    parameters: z.object({
        goal: z.string().describe("The high-level goal the user wants to achieve"),
        context: z.string().optional().describe("Additional context about the user's situation (e.g., industry, company type)"),
        steps: z.array(z.object({
            title: z.string().describe("Title of the step"),
            description: z.string().describe("Detailed description of what to do in this step"),
            metadata: z.record(z.any()).optional().describe("Metadata for the step, e.g., { action: 'register_company' } to link to specific app actions")
        })).describe("The generated steps for the roadmap")
    }),
    execute: async (args: { goal: string; context?: string; steps: any[] }) => {
        try {
            const roadmap = await createRoadmap({
                title: args.goal,
                description: args.context || `Plan för att: ${args.goal}`,
                steps: args.steps
            })

            return {
                success: true,
                message: `Roadmap created: ${roadmap.title}`,
                roadmapId: roadmap.id,
                roadmapTitle: roadmap.title,
                stepCount: roadmap.steps?.length,
                display: {
                    type: 'roadmap_preview',
                    data: {
                        id: roadmap.id,
                        title: roadmap.title,
                        description: roadmap.description,
                        steps: roadmap.steps
                    }
                }
            }
        } catch (error) {
            console.error("Failed to generate roadmap:", error)
            return {
                success: false,
                message: "Failed to create roadmap. Please try again."
            }
        }
    }
}
