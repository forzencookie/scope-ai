/**
 * Knowledge AI Tool
 *
 * Allows Scooby to load detailed domain knowledge on demand.
 * Each topic is a markdown file in src/data/ai-knowledge/.
 * Skill topics (skill_*) load workflow patterns from skills/ subdirectory.
 */

import fs from 'fs'
import path from 'path'
import { defineTool } from '../registry'

const VALID_TOPICS = [
    'bokforing',
    'rapporter',
    'loner',
    'agare',
    'handelser',
    'skatt',
    'foretagstyper',
    'skill_bokforing',
    'skill_loner',
    'skill_skatt',
    'skill_agare',
] as const

type KnowledgeTopic = typeof VALID_TOPICS[number]

// Cache loaded knowledge docs to avoid repeated file reads
const knowledgeCache = new Map<string, string>()

/**
 * Resolve a topic to its file path.
 * Skill topics (skill_*) resolve to skills/<domain>/SKILL.md.
 */
function resolveTopicPath(topic: string): string {
    if (topic.startsWith('skill_')) {
        const domain = topic.replace('skill_', '')
        return path.join('skills', domain, 'SKILL.md')
    }
    return `${topic}.md`
}

function loadKnowledgeFile(topic: string): string | null {
    if (knowledgeCache.has(topic)) {
        return knowledgeCache.get(topic)!
    }

    const relativePath = resolveTopicPath(topic)

    const possiblePaths = [
        path.join(process.cwd(), 'src', 'data', 'ai-knowledge', relativePath),
        path.join(process.cwd(), '..', 'src', 'data', 'ai-knowledge', relativePath),
    ]

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf-8')
            knowledgeCache.set(topic, content)
            return content
        }
    }

    return null
}

export interface GetKnowledgeParams {
    topic: KnowledgeTopic
}

export const getKnowledgeTool = defineTool<GetKnowledgeParams, string>({
    name: 'get_knowledge',
    description: 'Ladda detaljerad kunskap om ett amne. Anvand nar du behover specifika regler om bokforing, skatt, loner, bolagsratt, foretagstyper, eller arbetsfloden (skill_*). Tillgangliga amnen: bokforing, rapporter, loner, agare, handelser, skatt, foretagstyper, skill_bokforing, skill_loner, skill_skatt, skill_agare.',
    category: 'read',
    requiresConfirmation: false,
    coreTool: true,
    domain: 'common',
    keywords: ['kunskap', 'regler', 'lagar', 'information', 'hjälp', 'skill', 'arbetsflöde'],
    parameters: {
        type: 'object',
        properties: {
            topic: {
                type: 'string',
                enum: [...VALID_TOPICS],
                description: 'Amne att ladda kunskap om. Prefix skill_ for arbetsfloden.',
            },
        },
        required: ['topic'],
    },
    execute: async (params) => {
        if (!VALID_TOPICS.includes(params.topic)) {
            return {
                success: false,
                error: `Okant amne "${params.topic}". Tillgangliga: ${VALID_TOPICS.join(', ')}`,
            }
        }

        const content = loadKnowledgeFile(params.topic)

        if (!content) {
            return {
                success: false,
                error: `Kunde inte ladda kunskapsdokument for "${params.topic}".`,
            }
        }

        return {
            success: true,
            data: content,
            message: `Kunskapsdokument for "${params.topic}" laddat.`,
        }
    },
})

export const knowledgeTools = [getKnowledgeTool]
