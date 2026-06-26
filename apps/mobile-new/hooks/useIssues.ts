import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '@naligrid/shared'

type Issue = Database['public']['Tables']['issues']['Row']

export function useIssues(eventId: string) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchIssues = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('issues')
      .select('*, profiles:raised_by(display_name)')
      .eq('event_id', eventId)
      .order('raised_at', { ascending: false })
    if (data) setIssues(data as Issue[])
    setIsLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const resolveIssue = useCallback(async (issueId: string, resolution: string, resolvedBy: string) => {
    await supabase
      .from('issues')
      .update({ resolved_at: new Date().toISOString(), resolution, resolved_by: resolvedBy })
      .eq('id', issueId)
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, resolved_at: new Date().toISOString(), resolution, resolved_by: resolvedBy } : i))
  }, [])

  const openIssues = issues.filter(i => !i.resolved_at)
  const resolvedIssues = issues.filter(i => i.resolved_at)

  return { issues, openIssues, resolvedIssues, isLoading, refresh: fetchIssues, resolveIssue }
}
