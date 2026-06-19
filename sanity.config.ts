import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'

declare const process: { env: Record<string, string | undefined> } | undefined

function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta as any).env?.[key]
  }
  return undefined
}

const projectId = getEnv('VITE_SANITY_PROJECT_ID') || 'your-sanity-project-id'
const dataset = getEnv('VITE_SANITY_DATASET') || 'production'

export default defineConfig({
  name: 'default',
  title: 'NaliGrid CMS',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
