import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import styles from './FaqSection.module.css'

interface FaqItem {
  question: string
  answer: string
}

interface FaqCategory {
  category: string
  items: FaqItem[]
}

interface FaqSectionProps {
  items: FaqCategory[]
  header?: string
  summary?: string
}

export function FaqSection({ items, header, summary }: FaqSectionProps) {
  const [activeIdx, setActiveIdx] = useState<string | null>(null)

  const toggleFaq = (catIdx: number, itemIdx: number) => {
    const key = `${catIdx}-${itemIdx}`
    setActiveIdx(activeIdx === key ? null : key)
  }

  return (
    <section className={styles.faqSection} aria-label="Accordion FAQs">
      <div className={styles.container}>
        {header && <h2 className={styles.header}>{header}</h2>}
        {summary && <p className={styles.summary}>{summary}</p>}
        <div className={styles.faqCategories}>
          {items.map((cat, catIdx) => (
            <div key={cat.category} className={styles.faqCategoryBlock}>
              <h3 className={styles.faqCategoryTitle}>{cat.category}</h3>
              <div className={styles.faqList}>
                {cat.items.map((item, itemIdx) => {
                  const isOpen = activeIdx === `${catIdx}-${itemIdx}`
                  return (
                    <div key={item.question} className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}>
                      <button
                        className={styles.faqTrigger}
                        onClick={() => toggleFaq(catIdx, itemIdx)}
                        aria-expanded={isOpen}
                        id={`faq-trigger-${catIdx}-${itemIdx}`}
                      >
                        <span className={styles.faqQuestion}>{item.question}</span>
                        {isOpen ? <ChevronUp size={18} className={styles.faqChevron} /> : <ChevronDown size={18} className={styles.faqChevron} />}
                      </button>
                      {isOpen && (
                        <div className={styles.faqContent}>
                          <p className={styles.faqAnswer}>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
