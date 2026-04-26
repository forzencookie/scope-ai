import fs from 'fs'
import path from 'path'
import { defineTool } from '../registry'

const SKILLS_DIR = path.join(process.cwd(), 'src', 'prompts', 'skills')
const KNOWLEDGE_DIR = path.join(process.cwd(), 'src', 'knowledge')

const KNOWLEDGE_FILES: Record<string, string> = {
    'accounting/bas-accounts': 'accounting/bas-accounts.json',
    'accounting/vat-rates': 'accounting/vat-rates.md',
    'accounting/prisbasbelopp': 'accounting/prisbasbelopp.json',
    'accounting/arbetsgivaravgift': 'accounting/arbetsgivaravgift.md',
    'accounting/egenavgifter': 'accounting/egenavgifter.md',
    'accounting/formaner': 'accounting/formaner.md',
}

const SKILL_FILES = ['shared', 'ab', 'ef', 'hb', 'forening']

export const readSkillTool = defineTool<{ name: string }, { content: string }>({
    name: 'read_skill',
    description: 'Ladda en skill-fil eller kunskapsdokument. Anropa INNAN du gör bokförings-, skatte- eller bolagsrättsliga uppgifter. Skills: shared, ab, ef, hb, forening. Kunskap: accounting/bas-accounts, accounting/vat-rates, accounting/prisbasbelopp, accounting/arbetsgivaravgift, accounting/egenavgifter, accounting/formaner.',
    category: 'read',
    domain: 'common',
    coreTool: true,
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['skill', 'regler', 'kontext', 'ladda', 'kunskap', 'konton', 'moms', 'avgifter'],
    parameters: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Fil att ladda. Skills: shared | ab | ef | hb | forening. Kunskap: accounting/bas-accounts | accounting/vat-rates | accounting/prisbasbelopp | accounting/arbetsgivaravgift | accounting/egenavgifter | accounting/formaner.',
            },
        },
        required: ['name'],
    },
    execute: async (params) => {
        const name = params.name.trim()

        if (name.includes('/')) {
            const knowledgeFile = KNOWLEDGE_FILES[name]
            if (!knowledgeFile) {
                const available = Object.keys(KNOWLEDGE_FILES).join(', ')
                return { success: false, error: `Kunskapsfil "${name}" hittades inte. Tillgängliga: ${available}.` }
            }
            const filePath = path.join(KNOWLEDGE_DIR, knowledgeFile)
            const content = fs.readFileSync(filePath, 'utf-8').trim()
            return { success: true, data: { content }, message: content }
        }

        const safeName = name.replace(/[^a-z0-9_-]/gi, '').toLowerCase()
        const filePath = path.join(SKILLS_DIR, `${safeName}.md`)

        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: `Skill "${name}" hittades inte. Tillgängliga skills: ${SKILL_FILES.join(', ')}.`,
            }
        }

        const content = fs.readFileSync(filePath, 'utf-8').trim()
        return { success: true, data: { content }, message: content }
    },
})

export const readSkillTools = [readSkillTool]
