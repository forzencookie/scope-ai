import { initializeAITools } from '../src/lib/ai/tools'
import { aiToolRegistry } from '../src/lib/ai/tools/registry'
import type { AITool } from '../src/lib/ai/tools/types'
import * as fs from 'fs'
import * as path from 'path'

async function generateManifest() {
    console.log('--- Generating AI Tool Manifest ---')

    try {
        initializeAITools()

        const tools = aiToolRegistry.getAll()
        console.log(`Found ${tools.length} registered tools.`)

        const manifest = (tools as AITool[]).map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            category: tool.category,
            domain: tool.domain,
            requiresConfirmation: tool.requiresConfirmation,
            allowedCompanyTypes: tool.allowedCompanyTypes,
            keywords: tool.keywords,
        }))

        manifest.sort((a, b) => {
            if (a.domain !== b.domain) {
                return (a.domain || '').localeCompare(b.domain || '')
            }
            return a.name.localeCompare(b.name)
        })

        const outputPath = path.join(__dirname, '..', 'src', 'lib', 'ai', 'tools', 'manifest.json')
        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2))

        console.log(`Success! Manifest written to: ${outputPath}`)
        console.log(`Total Tools: ${manifest.length}`)
    } catch (error) {
        console.error('Failed to generate manifest:', error)
        process.exit(1)
    }
}

generateManifest()
