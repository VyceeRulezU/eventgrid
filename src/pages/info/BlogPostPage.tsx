import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/pages/landing/Footer'
import { STATIC_POSTS, getStaticPost } from './blogPosts'
import type { StaticPost, StaticBlock } from './blogPosts'
import styles from './BlogPostPage.module.css'
import { ArrowLeft } from 'lucide-react'

function getFeaturedImageUrl(post: StaticPost): string {
  return post.featuredImage?.placeholderUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80&auto=format&fit=crop'
}

function StaticBody({ body }: { body: StaticBlock[] }) {
  return (
    <>
      {body.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return block.level === 2 ? <h2 key={i}>{block.text}</h2> : <h3 key={i}>{block.text}</h3>
          case 'paragraph':
            return (
              <p key={i}>
                {block.bold ? <strong>{block.bold} </strong> : null}
                {block.text}
              </p>
            )
          case 'sectionImage':
            return (
              <figure key={i} className={styles.sectionImageWrap}>
                <img src={block.placeholderUrl} alt={block.alt} className={styles.sectionImage} loading="lazy" />
                {block.caption && (
                  <figcaption className={styles.sectionImageCaption}>{block.caption}</figcaption>
                )}
              </figure>
            )
          case 'cta':
            return (
              <section key={i} className={styles.ctaSection}>
                <p style={{ color: '#e5e7eb', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px 0' }}>
                  {block.text}
                </p>
                <a href={block.buttonUrl} className={styles.ctaButton}>
                  {block.buttonText}
                </a>
              </section>
            )
          default:
            return null
        }
      })}
    </>
  )
}

function Sidebar({ currentPost, allPosts }: { currentPost: StaticPost; allPosts: StaticPost[] }) {
  const otherPosts = allPosts.filter((p) => p.slug.current !== currentPost.slug.current).slice(0, 3)
  const tags = currentPost.tags

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarCard}>
        <h3 className={styles.sidebarCardTitle}>More Articles</h3>
        {otherPosts.map((post) => (
          <Link key={post._id} to={`/blog/${post.slug.current}`} className={styles.sidebarPostLink}>
            {post.title}
            <span className={styles.sidebarPostLinkMeta}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </Link>
        ))}
      </div>

      <div className={styles.sidebarCard}>
        <h3 className={styles.sidebarCardTitle}>Category</h3>
        <span className={styles.tag}>{currentPost.category}</span>
      </div>

      {tags.length > 0 && (
        <div className={styles.sidebarCard}>
          <h3 className={styles.sidebarCardTitle}>Tags</h3>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className={styles.sidebarCta}>
        <div className={styles.sidebarLogo}>
          Nali<span className={styles.sidebarLogoAccent}>Grid</span>
        </div>
        <p className={styles.sidebarTagline}>
          Nigeria's event planning platform for professionals
        </p>
        <a href="/register" className={styles.sidebarCtaButton}>
          Start for FREE →
        </a>
      </div>
    </aside>
  )
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<StaticPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    const staticPost = getStaticPost(slug)
    if (staticPost) setPost(staticPost)
    else setNotFound(true)
    setLoading(false)
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

  return (
    <div className={styles.pageWrapper}>
      <SEO
        title={post.metaTitle || `${post.title} | NaliGrid Blog`}
        description={post.excerpt}
        url={`/blog/${post.slug.current}`}
        image={getFeaturedImageUrl(post)}
        type="article"
        publishedTime={post.publishedAt}
      />

      <Navbar />

      <article className={styles.article}>
        <div className={styles.container}>
          <Link to="/blog" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <div className={styles.contentLayout}>
            <div className={styles.mainContent}>
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
                  src={getFeaturedImageUrl(post)}
                  alt={post.featuredImage.alt || post.title}
                  className={styles.featuredImage}
                />
              </div>

              <div className={styles.bodyContent}>
                <StaticBody body={post.body} />
              </div>
            </div>

            <Sidebar currentPost={post} allPosts={STATIC_POSTS} />
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}
