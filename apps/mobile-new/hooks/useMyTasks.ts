import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '@naligrid/shared'

type Task = Database['public']['Tables']['tasks']['Row']

export function useMyTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, events!inner(name)')
      .eq('assignee_id', userId)
      .order('due_datetime', { ascending: true })
    if (data) setTasks(data as Task[])
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const markDone = useCallback(async (taskId: string) => {
    await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t))
  }, [])

  const pendingTasks = tasks.filter(t => t.status !== 'done')

  return { tasks, pendingTasks, isLoading, refresh: fetchTasks, markDone }
}
