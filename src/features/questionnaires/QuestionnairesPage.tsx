import { useEffect, useState } from 'react'
import { Plus, X, Trash2, ExternalLink, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import styles from './QuestionnairesPage.module.css'
import type { Questionnaire, QuestionnaireQuestion, QuestionnaireResponse } from '@/types'

const QUESTION_TYPES = ['text', 'textarea', 'select', 'radio', 'checkbox', 'rating'] as const

export function QuestionnairesPage() {
  const { eventId, isReadOnly } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const showNotification = useUIStore((s) => s.showNotification)

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedQ, setSelectedQ] = useState<Questionnaire | null>(null)
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')

  const [form, setForm] = useState({ title: '', description: '' })
  const [qForm, setQForm] = useState({ questionText: '', questionType: 'text' as string, options: '', isRequired: false })

  useEffect(() => {
    loadQuestionnaires()
  }, [eventId])

  async function loadQuestionnaires() {
    setLoading(true)
    let query = supabase.from('questionnaires').select('*').order('created_at', { ascending: false })
    if (eventId) query = query.eq('event_id', eventId)
    const { data } = await query
    if (data) setQuestionnaires(data as Questionnaire[])
    setLoading(false)
  }

  async function loadDetail(q: Questionnaire) {
    setSelectedQ(q)
    setViewMode('detail')
    const [qRes, rRes] = await Promise.all([
      supabase.from('questionnaire_questions').select('*').eq('questionnaire_id', q.id).order('sort_order', { ascending: true }),
      supabase.from('questionnaire_responses').select('*').eq('questionnaire_id', q.id),
    ])
    if (qRes.data) setQuestions(qRes.data as QuestionnaireQuestion[])
    if (rRes.data) setResponses(rRes.data as QuestionnaireResponse[])
  }

  async function handleCreate() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('questionnaires').insert({
      event_id: eventId || null, org_id: profile?.org_id, created_by: user!.id,
      title: form.title.trim(), description: form.description || null,
    }).select().single()
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); setSaving(false); return }
    setQuestionnaires([data as unknown as Questionnaire, ...questionnaires])
    setForm({ title: '', description: '' })
    setShowForm(false)
    setSaving(false)
    loadDetail(data as unknown as Questionnaire)
  }

  async function addQuestion() {
    if (!qForm.questionText.trim()) return
    const options = qForm.questionType === 'select' || qForm.questionType === 'radio' || qForm.questionType === 'checkbox'
      ? qForm.options.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const { data, error } = await supabase.from('questionnaire_questions').insert({
      questionnaire_id: selectedQ!.id, question_text: qForm.questionText.trim(),
      question_type: qForm.questionType as any, options, is_required: qForm.isRequired,
      sort_order: questions.length + 1,
    }).select().single()
    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
    setQuestions([...questions, data as unknown as QuestionnaireQuestion])
    setQForm({ questionText: '', questionType: 'text', options: '', isRequired: false })
  }

  async function deleteQuestion(id: string) {
    await supabase.from('questionnaire_questions').delete().eq('id', id)
    setQuestions(questions.filter(q => q.id !== id))
  }

  async function deleteQuestionnaire(id: string) {
    await supabase.from('questionnaires').delete().eq('id', id)
    setQuestionnaires(questionnaires.filter(q => q.id !== id))
    if (selectedQ?.id === id) { setViewMode('list'); setSelectedQ(null) }
  }

  const shareUrl = selectedQ ? `${window.location.origin}/questionnaire/${selectedQ.id}` : ''

  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

  if (viewMode === 'detail' && selectedQ) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setViewMode('list'); setSelectedQ(null) }}>← Back</button>
          <h2 style={{ margin: 0, flex: 1 }}>{selectedQ.title}</h2>
          <a href={shareUrl} target="_blank" className="btn btn-secondary btn-sm"><ExternalLink size={14} /> Share</a>
        </div>
        {selectedQ.description && <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>{selectedQ.description}</p>}

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: '0 0 12px' }}>Questions ({questions.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.map((q, i) => (
              <div key={q.id} className={styles.questionRow}>
                <div style={{ flex: 1 }}>
                  <strong>Q{i + 1}:</strong> {q.question_text}
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {q.question_type}{q.is_required ? ' · Required' : ''}
                    {q.options.length > 0 ? ` · Options: ${q.options.join(', ')}` : ''}
                  </div>
                </div>
                {!isReadOnly && (
                  <button className="btn btn-ghost btn-icon btn-xs" onClick={() => deleteQuestion(q.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!isReadOnly && (
            <>
              <div className={styles.addQForm}>
                <input className="input" placeholder="Question text" value={qForm.questionText} onChange={e => setQForm({...qForm, questionText: e.target.value})} style={{ flex: 1 }} />
                <select className="input" value={qForm.questionType} onChange={e => setQForm({...qForm, questionType: e.target.value})} style={{ width: 120 }}>
                  {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={addQuestion}>Add</button>
              </div>
              {(qForm.questionType === 'select' || qForm.questionType === 'radio' || qForm.questionType === 'checkbox') && (
                <div className="input-wrapper" style={{ marginTop: 8 }}>
                  <label className="input-label">Options (comma-separated)</label>
                  <input className="input" value={qForm.options} onChange={e => setQForm({...qForm, options: e.target.value})} placeholder="Option 1, Option 2, Option 3" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: '0 0 12px' }}>Responses ({responses.length})</h3>
          {responses.length === 0 ? (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No responses yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {responses.map(r => (
                <div key={r.id} className={styles.responseCard}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{r.respondent_name}{r.respondent_email ? ` (${r.respondent_email})` : ''}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{new Date(r.submitted_at).toLocaleString()}</div>
                  <pre style={{ fontSize: 'var(--text-xs)', margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{JSON.stringify(r.answers, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero icon={FileText} title="Questionnaires" subtitle="Create and manage client questionnaires"
        actions={
          !isReadOnly && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> New Questionnaire
            </button>
          )
        }
      />

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">New Questionnaire</h3>
              <button className="modal-card-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-wrapper"><label className="input-label">Title *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="input-wrapper"><label className="input-label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {questionnaires.length === 0 ? (
          <div className="empty-state"><div className="empty-state__title">No questionnaires yet</div></div>
        ) : questionnaires.map(q => (
          <div key={q.id} className="card" style={{ padding: 'var(--space-4) var(--space-5)', cursor: 'pointer' }} onClick={() => loadDetail(q)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{q.title}</div>
                {q.description && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{q.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
              {!isReadOnly && (
                <button className="btn btn-ghost btn-icon btn-xs" onClick={(e) => { e.stopPropagation(); deleteQuestionnaire(q.id) }}>
                  <Trash2 size={14} />
                </button>
              )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
