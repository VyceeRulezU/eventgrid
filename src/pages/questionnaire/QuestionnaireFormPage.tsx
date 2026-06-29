import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'
import type { Questionnaire, QuestionnaireQuestion } from '@/types'

export function QuestionnaireFormPage() {
  const { id } = useParams<{ id: string }>()
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadQuestionnaire()
  }, [id])

  async function loadQuestionnaire() {
    setLoading(true)
    const { data: q, error: qErr } = await supabase.from('questionnaires').select('*').eq('id', id).single()
    if (qErr || !q) { setError('Questionnaire not found'); setLoading(false); return }
    setQuestionnaire(q as Questionnaire)
    const { data: questionsData } = await supabase.from('questionnaire_questions').select('*').eq('questionnaire_id', id).order('sort_order', { ascending: true })
    if (questionsData) setQuestions(questionsData as QuestionnaireQuestion[])
    setLoading(false)
  }

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  function handleCheckboxChange(questionId: string, option: string) {
    const current = (answers[questionId] as string[]) || []
    if (current.includes(option)) {
      setAnswer(questionId, current.filter(v => v !== option))
    } else {
      setAnswer(questionId, [...current, option])
    }
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Your name is required'); return }
    setError(null)
    setSaving(true)
    const { error: submitErr } = await supabase.from('questionnaire_responses').insert({
      questionnaire_id: id, respondent_name: name.trim(),
      respondent_email: email || null, answers,
    })
    if (submitErr) { setError(submitErr.message); setSaving(false); return }
    setSubmitted(true)
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#111827', color: '#F9FAFB' }}>
      <div style={{ textAlign: 'center' }}><div className="skeleton skeleton-card" style={{ height: 200, width: 400 }} /></div>
    </div>
  )

  if (error && !questionnaire) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#111827', color: '#F9FAFB' }}>
      <div style={{ textAlign: 'center', color: '#EF4444' }}>{error}</div>
    </div>
  )

  if (submitted) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#111827', color: '#F9FAFB' }}>
      <div style={{ textAlign: 'center' }}>
        <CheckCircle size={48} style={{ color: '#22C55E', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Response Submitted</h1>
        <p style={{ color: '#9CA3AF' }}>Thank you for your feedback!</p>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#111827', color: '#F9FAFB',
      display: 'flex', justifyContent: 'center', padding: '48px 16px',
    }}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <div style={{
          background: '#1F2937', border: '1px solid #374151', borderRadius: 16,
          padding: 32,
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{questionnaire?.title || 'Questionnaire'}</h1>
          {questionnaire?.description && <p style={{ color: '#9CA3AF', marginBottom: 24 }}>{questionnaire.description}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 4 }}>Your Name *</label>
              <input style={{
                width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151',
                borderRadius: 8, color: '#F9FAFB', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }} value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 4 }}>Email</label>
              <input style={{
                width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151',
                borderRadius: 8, color: '#F9FAFB', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {questions.map((q, i) => (
              <div key={q.id}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {i + 1}. {q.question_text}
                  {q.is_required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
                </label>

                {(q.question_type === 'text') && (
                  <input style={{
                    width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151',
                    borderRadius: 8, color: '#F9FAFB', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }} value={(answers[q.id] as string) || ''} onChange={e => setAnswer(q.id, e.target.value)} />
                )}

                {q.question_type === 'textarea' && (
                  <textarea style={{
                    width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151',
                    borderRadius: 8, color: '#F9FAFB', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    minHeight: 80, resize: 'vertical', fontFamily: 'inherit',
                  }} value={(answers[q.id] as string) || ''} onChange={e => setAnswer(q.id, e.target.value)} />
                )}

                {q.question_type === 'select' && (
                  <select style={{
                    width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151',
                    borderRadius: 8, color: '#F9FAFB', fontSize: 14, outline: 'none',
                  }} value={(answers[q.id] as string) || ''} onChange={e => setAnswer(q.id, e.target.value)}>
                    <option value="">Select...</option>
                    {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}

                {q.question_type === 'radio' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.options.map(o => (
                      <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                        <input type="radio" name={q.id} value={o} checked={(answers[q.id] as string) === o}
                          onChange={e => setAnswer(q.id, e.target.value)} />
                        {o}
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'checkbox' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.options.map(o => (
                      <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                        <input type="checkbox" value={o} checked={((answers[q.id] as string[]) || []).includes(o)}
                          onChange={() => handleCheckboxChange(q.id, o)} />
                        {o}
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'rating' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" style={{
                        width: 40, height: 40, borderRadius: 8, border: `2px solid ${(answers[q.id] as string) === String(n) ? '#D4A017' : '#374151'}`,
                        background: (answers[q.id] as string) === String(n) ? 'rgba(212,160,23,0.15)' : 'transparent',
                        color: (answers[q.id] as string) === String(n) ? '#D4A017' : '#9CA3AF',
                        cursor: 'pointer', fontWeight: 700, fontSize: 16,
                      }} onClick={() => setAnswer(q.id, String(n))}>{n}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 16 }}>{error}</div>}

          <button style={{
            width: '100%', marginTop: 24, padding: '12px 24px', background: '#D4A017', color: '#111827',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </div>
    </div>
  )
}
