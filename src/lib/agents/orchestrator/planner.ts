/**
 * Workflow Planner
 * 
 * Creates execution plans for multi-agent workflows.
 * Breaks down complex requests into sequential or parallel agent tasks.
 */

import type {
    AgentDomain,
    AgentContext,
    Intent,
    IntentCategory,
} from '../types'

// =============================================================================
// Workflow Types
// =============================================================================

/**
 * A single step in a workflow.
 */
export interface WorkflowStep {
    id: string
    agentId: AgentDomain
    task: string
    dependsOn?: string[]        // Step IDs this depends on
    optional?: boolean          // Can skip if fails
    timeout?: number            // Max time in ms
}

/**
 * A complete workflow plan.
 */
export interface WorkflowPlan {
    id: string
    name: string
    description: string
    steps: WorkflowStep[]
    currentStep: number
    status: 'pending' | 'running' | 'completed' | 'failed'
    createdAt: number
}

// =============================================================================
// Workflow Templates
// =============================================================================

/**
 * Pre-defined workflow templates for common multi-agent scenarios.
 */
const WORKFLOW_TEMPLATES: Record<string, Omit<WorkflowPlan, 'id' | 'currentStep' | 'status' | 'createdAt'>> = {
    // Yearly closing workflow
    'arsbokslut': {
        name: 'Årsbokslut',
        description: 'Förbered årsbokslut med alla nödvändiga steg',
        steps: [
            {
                id: 'check-open',
                agentId: 'bokforing',
                task: 'Kontrollera och stäng öppna verifikationer',
            },
            {
                id: 'periodisering',
                agentId: 'skatt',
                task: 'Beräkna periodiseringsfonder och skatteavsättningar',
                dependsOn: ['check-open'],
            },
            {
                id: 'generate-reports',
                agentId: 'rapporter',
                task: 'Generera resultat- och balansräkning',
                dependsOn: ['periodisering'],
            },
            {
                id: 'check-compliance',
                agentId: 'compliance',
                task: 'Kontrollera deadlines för årsredovisning',
                dependsOn: ['generate-reports'],
            },
        ],
    },

    // Salary payment workflow
    'loneutbetalning': {
        name: 'Löneutbetalning',
        description: 'Processa löneutbetalning och relaterade rapporter',
        steps: [
            {
                id: 'calc-salary',
                agentId: 'loner',
                task: 'Beräkna lön med skatt och avgifter',
            },
            {
                id: 'book-salary',
                agentId: 'bokforing',
                task: 'Bokför lönekostnader',
                dependsOn: ['calc-salary'],
            },
            {
                id: 'log-event',
                agentId: 'handelser',
                task: 'Logga löneutbetalning i händelseloggen',
                dependsOn: ['book-salary'],
            },
        ],
    },

    // VAT declaration workflow
    'momsdeklaration': {
        name: 'Momsdeklaration',
        description: 'Förbered och skicka momsdeklaration',
        steps: [
            {
                id: 'check-receipts',
                agentId: 'receipts',
                task: 'Kontrollera att alla kvitton är bokförda',
            },
            {
                id: 'check-invoices',
                agentId: 'invoices',
                task: 'Kontrollera kundfakturor för perioden',
            },
            {
                id: 'calc-vat',
                agentId: 'skatt',
                task: 'Beräkna moms för perioden',
                dependsOn: ['check-receipts', 'check-invoices'],
            },
            {
                id: 'submit',
                agentId: 'compliance',
                task: 'Förbered inlämning till Skatteverket',
                dependsOn: ['calc-vat'],
            },
        ],
    },

    // Company health check
    'halsokontroll': {
        name: 'Företagshälsokontroll',
        description: 'Komplett genomgång av företagets ekonomiska status',
        steps: [
            {
                id: 'kpis',
                agentId: 'statistik',
                task: 'Beräkna alla nyckeltal',
            },
            {
                id: 'reports',
                agentId: 'rapporter',
                task: 'Generera finansiella rapporter',
            },
            {
                id: 'deadlines',
                agentId: 'compliance',
                task: 'Kontrollera kommande deadlines',
            },
            {
                id: 'summary',
                agentId: 'statistik',
                task: 'Sammanfatta företagets hälsa',
                dependsOn: ['kpis', 'reports', 'deadlines'],
            },
        ],
    },

    // New invoice workflow
    'ny-faktura': {
        name: 'Ny kundfaktura',
        description: 'Skapa och bokför ny kundfaktura',
        steps: [
            {
                id: 'create-invoice',
                agentId: 'invoices',
                task: 'Skapa faktura',
            },
            {
                id: 'book-invoice',
                agentId: 'bokforing',
                task: 'Bokför fakturan',
                dependsOn: ['create-invoice'],
            },
            {
                id: 'log-event',
                agentId: 'handelser',
                task: 'Logga i händelseloggen',
                dependsOn: ['book-invoice'],
                optional: true,
            },
        ],
    },
}

// =============================================================================
// Workflow Planning
// =============================================================================

/**
 * Create a workflow plan for a multi-agent request.
 */
export async function createWorkflowPlan(
    message: string,
    intent: Intent,
    context: AgentContext
): Promise<WorkflowPlan> {
    // Check for matching template
    const template = findMatchingTemplate(message, intent)

    if (template) {
        return {
            ...template,
            id: crypto.randomUUID(),
            currentStep: 0,
            status: 'pending',
            createdAt: Date.now(),
        }
    }

    // Generate dynamic plan based on suggested agents
    return generateDynamicPlan(message, intent, context)
}

/**
 * Find a matching workflow template.
 */
function findMatchingTemplate(
    message: string,
    intent: Intent
): typeof WORKFLOW_TEMPLATES[string] | null {
    const lowerMessage = message.toLowerCase()

    // Check for template keywords
    const templateKeywords: Record<string, string[]> = {
        'arsbokslut': ['årsbokslut', 'bokslut', 'avsluta året', 'stäng böckerna'],
        'loneutbetalning': ['betala lön', 'löneutbetalning', 'lönedag'],
        'momsdeklaration': ['momsdeklaration', 'deklarera moms', 'moms till skatteverket'],
        'halsokontroll': ['hur går det', 'företagets hälsa', 'ekonomisk status', 'översikt'],
        'ny-faktura': ['skapa faktura', 'ny faktura', 'fakturera'],
    }

    for (const [templateId, keywords] of Object.entries(templateKeywords)) {
        for (const keyword of keywords) {
            if (lowerMessage.includes(keyword)) {
                return WORKFLOW_TEMPLATES[templateId]
            }
        }
    }

    return null
}

/**
 * Generate a dynamic plan based on intent and suggested agents.
 */
function generateDynamicPlan(
    message: string,
    intent: Intent,
    context: AgentContext
): WorkflowPlan {
    const steps: WorkflowStep[] = []

    if (intent.suggestedAgents) {
        for (let i = 0; i < intent.suggestedAgents.length; i++) {
            const agentId = intent.suggestedAgents[i] as AgentDomain
            
            steps.push({
                id: `step-${i}`,
                agentId,
                task: message,  // Each agent handles the full message
                dependsOn: i > 0 ? [`step-${i - 1}`] : undefined,
            })
        }
    }

    return {
        id: crypto.randomUUID(),
        name: 'Dynamiskt arbetsflöde',
        description: `Genererat för: ${message.substring(0, 50)}...`,
        steps,
        currentStep: 0,
        status: 'pending',
        createdAt: Date.now(),
    }
}

/**
 * Get the next executable steps (steps whose dependencies are met).
 */
export function getExecutableSteps(
    plan: WorkflowPlan,
    completedStepIds: string[]
): WorkflowStep[] {
    return plan.steps.filter(step => {
        // Skip already completed
        if (completedStepIds.includes(step.id)) return false

        // Check dependencies
        if (step.dependsOn) {
            return step.dependsOn.every(depId => completedStepIds.includes(depId))
        }

        return true
    })
}

/**
 * Check if workflow can run steps in parallel.
 */
export function canRunParallel(steps: WorkflowStep[]): boolean {
    // Steps can run in parallel if they have no interdependencies
    const stepIds = new Set(steps.map(s => s.id))
    
    for (const step of steps) {
        if (step.dependsOn?.some(depId => stepIds.has(depId))) {
            return false
        }
    }

    return true
}
