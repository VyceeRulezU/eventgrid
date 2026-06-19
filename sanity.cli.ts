import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.VITE_SANITY_PROJECT_ID || 'your-sanity-project-id'
const dataset = process.env.VITE_SANITY_DATASET || 'production'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
})
