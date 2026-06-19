import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from '../src/sanity/schemas'

export default defineConfig({
  name: 'default',
  title: 'NaliGrid CMS',
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'your-sanity-project-id',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
