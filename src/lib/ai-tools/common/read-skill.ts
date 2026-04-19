import fs from 'fs'
import path from 'path'
import { defineTool } from '../registry'

const SKILLS_DIR = path.join(process.cwd(), 'src', 'lib', 'agents', 'scope-brain', 'prompt', 'skills')

export const readSkillTool = defineTool<{ name: string }, { content: string }>({
    name: 'read_skill',
    description: 'Ladda en skill-fil med regler och kontext för ett specifikt område. Anropa INNAN du gör bokförings-, skatte- eller bolagsrättsliga uppgifter. Tillgängliga skills: shared, ab, ef, hb, forening.',
    category: 'read',
    domain: 'common',
    coreTool: true,
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['skill', 'regler', 'kontext', 'ladda', 'kunskap'],
    parameters: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Skill att ladda. En av: shared, ab, ef, hb, forening.',
            },
        },
        required: ['name'],
    },
    execute: async (params) => {
        const safeName = params.name.replace(/[^a-z0-9_-]/gi, '').toLowerCase()
        const filePath = path.join(SKILLS_DIR, `${safeName}.md`)

        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: `Skill "${params.name}" hittades inte. Tillgängliga: shared, ab, ef, hb, forening.`,
            }
        }

        const content = fs.readFileSync(filePath, 'utf-8').trim()
        return {
            success: true,
            data: { content },
            message: content,
        }
    },
})

export const readSkillTools = [readSkillTool]
