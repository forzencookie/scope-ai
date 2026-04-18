/**
 * System Prompt Assembler — Scope Brain v5
 *
 * Reads markdown files from prompt/ folder, injects date + company context.
 *
 * Assembly order:
 *   main.md            — Scooby identity + operating loop
 *   skills/{type}.md   — Company-type expertise (one file per session)
 *   skills/shared.md   — Universal accounting rules
 *   manuals/tools.md   — Intent → tool mapping
 *   manuals/chat-tools.md — UI output protocol
 *   ## Context block   — Company type + date (dynamic)
 *   ## Message Context — Per-message: page, mentions, attachments
 *
 * Token budget: ~1,500 tokens total.
 */

import fs from 'fs'
import path from 'path'
import type { AgentContext } from '../types'

const PROMPT_DIR = path.join(process.cwd(), 'src', 'lib', 'agents', 'scope-brain', 'prompt')

function readPromptFile(relativePath: string): string {
    const fullPath = path.join(PROMPT_DIR, relativePath)
    if (!fs.existsSync(fullPath)) return ''
    return fs.readFileSync(fullPath, 'utf-8').trim()
}

function companyTypeToSkillFile(type: AgentContext['companyType']): string | null {
    if (!type) return null
    const map: Record<NonNullable<AgentContext['companyType']>, string> = {
        'AB': 'skills/ab.md',
        'EF': 'skills/ef.md',
        'HB': 'skills/hb.md',
        'KB': 'skills/hb.md',
        'FORENING': 'skills/forening.md',
    }
    return map[type] ?? null
}

function formatCompanyType(type: AgentContext['companyType']): string {
    if (!type) return 'Unknown'
    const names: Record<NonNullable<AgentContext['companyType']>, string> = {
        'AB': 'Aktiebolag (AB)',
        'EF': 'Enskild firma (EF)',
        'HB': 'Handelsbolag (HB)',
        'KB': 'Kommanditbolag (KB)',
        'FORENING': 'Förening',
    }
    return names[type] || type
}

export function buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = []

    // 1. Core identity + operating loop
    const main = readPromptFile('main.md')
    if (main) parts.push(main)

    // 2. Company-type skill (AB / EF / HB / KB / FORENING)
    const skillFile = companyTypeToSkillFile(context.companyType)
    if (skillFile) {
        const skill = readPromptFile(skillFile)
        if (skill) parts.push(skill)
    }

    // 3. Universal accounting rules
    const shared = readPromptFile('skills/shared.md')
    if (shared) parts.push(shared)

    // 4. Tool intent map
    const toolsManual = readPromptFile('manuals/tools.md')
    if (toolsManual) parts.push(toolsManual)

    // 5. UI output protocol
    const chatToolsManual = readPromptFile('manuals/chat-tools.md')
    if (chatToolsManual) parts.push(chatToolsManual)

    // 6. Dynamic context — company type + date
    const today = new Date().toISOString().slice(0, 10)
    if (!context.companyId || !context.companyType) {
        parts.push(
            `## Context\n\nDatum: **${today}**\n\n⚠️ Ingen företagsprofil kopplad. Du kan svara på allmänna frågor men inte bokföra, fakturera eller köra löner. När användaren vill göra något som kräver företagsuppgifter — fråga efter företagsnamn, organisationsnummer och företagsform och spara med update_company_info.`
        )
    } else {
        parts.push(
            `## Context\n\nDatum: **${today}**\nFöretagstyp: **${formatCompanyType(context.companyType)}**\n\nAnvänd get_company_info när du behöver specifika företagsuppgifter.`
        )
    }

    // 7. Per-message context (page, mentions, attachments — lightweight, no DB)
    const messageContext = buildMessageContext(context)
    if (messageContext) parts.push(messageContext)

    return parts.join('\n\n---\n\n')
}

function buildMessageContext(context: AgentContext): string | null {
    const lines: string[] = []

    if (context.sharedMemory?.currentPage) {
        lines.push(`**Aktuell sida:** ${context.sharedMemory.currentPage}`)
    }

    if (context.sharedMemory?.mentions && Array.isArray(context.sharedMemory.mentions)) {
        const pageContexts = (context.sharedMemory.mentions as Array<{
            type: string
            label: string
            aiContext?: string
        }>)
            .filter(m => m.type === 'page' && m.aiContext)
            .map(m => m.aiContext)

        if (pageContexts.length > 0) {
            lines.push(`**Siddata:**\n${pageContexts.join('\n\n')}`)
        }
    }

    if (context.sharedMemory?.attachments) {
        lines.push(`**Bilagor:** ${JSON.stringify(context.sharedMemory.attachments)}`)
    }

    return lines.length > 0 ? `## Message Context\n\n${lines.join('\n')}` : null
}

export function estimateSystemPromptTokens(): number {
    const files = [
        'main.md',
        'skills/ab.md',
        'skills/shared.md',
        'manuals/tools.md',
        'manuals/chat-tools.md',
    ]
    let chars = 0
    for (const f of files) {
        const fullPath = path.join(PROMPT_DIR, f)
        if (fs.existsSync(fullPath)) {
            chars += fs.readFileSync(fullPath, 'utf-8').length
        }
    }
    return Math.ceil(chars / 4) + 150 // context block buffer
}
