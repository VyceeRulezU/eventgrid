import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/pages/landing/Footer'
import { urlFor, getPostBySlug } from '@/lib/sanity'
import type { SanityPost } from '@/lib/sanity'
import styles from './BlogPostPage.module.css'
import { ArrowLeft } from 'lucide-react'

function getImageUrl(post: SanityPost): string {
  if (post.featuredImage?.asset) {
    return urlFor(post.featuredImage.asset).width(1200).url()
  }
  return post.featuredImage?.placeholderUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80&auto=format&fit=crop'
}

const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    normal: ({ children }) => <p>{children}</p>,
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset && !value?.placeholderUrl) return null
      const imgUrl = value.asset
        ? urlFor(value.asset).width(800).url()
        : value.placeholderUrl
      return (
        <figure className={styles.inlineImageWrap}>
          <img
            src={imgUrl}
            alt={value.alt || ''}
            className={styles.inlineImage}
            loading="lazy"
          />
          {value.caption && (
            <figcaption className={styles.inlineImageCaption}>{value.caption}</figcaption>
          )}
        </figure>
      )
    },
    sectionImage: ({ value }) => {
      if (!value?.image?.asset && !value?.placeholderUrl) return null
      const imgUrl = value.image?.asset
        ? urlFor(value.image.asset).width(1200).url()
        : value.placeholderUrl
      return (
        <figure className={styles.sectionImageWrap}>
          <img
            src={imgUrl}
            alt={value.alt || ''}
            className={styles.sectionImage}
            loading="lazy"
          />
          {value.caption && (
            <figcaption className={styles.sectionImageCaption}>{value.caption}</figcaption>
          )}
        </figure>
      )
    },
  },
  marks: {
    link: ({ children, value }) => {
      const rel = value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined
      return (
        <a href={value?.href} target="_blank" rel={rel}>
          {children}
        </a>
      )
    },
  },
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<SanityPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return

    const projectId = import.meta.env.VITE_SANITY_PROJECT_ID

    if (!projectId || projectId === 'your-sanity-project-id') {
      setLoading(false)
      setNotFound(true)
      return
    }

    setLoading(true)
    getPostBySlug(slug)
      .then((data) => {
        if (data) {
          setPost(data)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => {
        setNotFound(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Navbar />
        <div className={styles.loading}>Loading article...</div>
        <Footer />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className={styles.pageWrapper}>
        <Navbar />
        <div className={styles.container} style={{ paddingTop: 120, paddingBottom: 120, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: '#f9fafb', marginBottom: 12 }}>Post Not Found</h1>
          <p style={{ color: '#9ca3af', marginBottom: 24 }}>
            The article you're looking for doesn't exist or hasn't been published yet.
          </p>
          <Link to="/blog" className={styles.backLink} style={{ display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const imageUrl = getImageUrl(post)
  const metaTitle = post.metaTitle || `${post.title} | NaliGrid Blog`
  const metaDescription = post.metaDescription || post.excerpt

  return (
    <div className={styles.pageWrapper}>
      <SEO
        title={metaTitle}
        description={metaDescription}
        url={`/blog/${post.slug.current}`}
        image={imageUrl}
        type="article"
        publishedTime={post.publishedAt}
      />

      <Navbar />

      <article className={styles.article}>
        <div className={styles.container}>
          <Link to="/blog" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <header className={styles.header}>
            <span className={styles.category}>{post.category}</span>
            <h1 className={styles.title}>{post.title}</h1>
            <div className={styles.meta}>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className={styles.metaDot}>·</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          <div className={styles.featuredImageWrap}>
            <img
              src={imageUrl}
              alt={post.featuredImage?.alt || post.title}
              className={styles.featuredImage}
            />
          </div>

          {post.body && (
            <div className={styles.bodyContent}>
              <PortableText
                value={post.body as any}
                components={portableTextComponents}
              />
            </div>
          )}

          <section className={styles.ctaSection}>
            <h2 className={styles.ctaTitle}>Ready to try a better way?</h2>
            <p className={styles.ctaDesc}>
              NaliGrid is currently in beta — available to a limited number of planners before public launch.
              You can create your first event for ₦100 during the beta period.
            </p>
            <a href="/register" className={styles.ctaButton}>
              Start for ₦100 →
            </a>
          </section>
        </div>
      </article>

      <Footer />
    </div>
  )
}
