import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-06-01'

export const client = createClient({
  projectId: projectId || 'your-sanity-project-id',
  dataset,
  apiVersion,
  useCdn: true,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export interface SanityPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category: string
  publishedAt: string
  readTime: string
  featuredImage?: {
    asset?: SanityImageSource
    alt?: string
    placeholderUrl?: string
  }
  body?: unknown[]
  metaTitle?: string
  metaDescription?: string
  keywords?: string
}

const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  category,
  publishedAt,
  readTime,
  featuredImage {
    asset->,
    alt,
    placeholderUrl
  }
}`

const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  category,
  publishedAt,
  readTime,
  featuredImage {
    asset->,
    alt,
    placeholderUrl
  },
  body[] {
    ...,
    _type == "image" => {
      ...,
      asset->
    },
    _type == "sectionImage" => {
      ...,
      image {
        asset->,
        ...
      }
    }
  },
  metaTitle,
  metaDescription,
  keywords
}`

export async function getPosts(): Promise<SanityPost[]> {
  return client.fetch(POSTS_QUERY)
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  return client.fetch(POST_BY_SLUG_QUERY, { slug })
}
