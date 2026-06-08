import type { NavigateFunction } from 'react-router-dom'
import { supabase } from './supabase'
import type { Notification } from '@/types'

export function navigateFromNotification(n: Notification, navigate: NavigateFunction) {
  if (n.event_id) {
    switch (n.type) {
      case 'task_assigned':
        navigate(`/events/${n.event_id}/tasks`)
        return
      case 'issue_raised':
      case 'issue_resolved':
        navigate(`/events/${n.event_id}/live-board`)
        return
      case 'vendor_update':
      case 'vendor_confirmed':
        navigate(`/events/${n.event_id}/vendors`)
        return
    }
  }
  switch (n.type) {
    case 'feedback_reply':
      navigate('/admin/feedback')
      return
  }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  eventId?: string,
) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      event_id: eventId || null,
      type,
      title,
      body: body || null,
    })

  if (error) console.error('Failed to create notification:', error)
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (n: Notification) => void,
) {
  const channel = supabase
    .channel('notifications-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function getNotifications(
  userId: string,
  limit = 50,
): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data as Notification[]) || []
}

export async function markAsRead(notificationId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
}

export async function markAllAsRead(userId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return count || 0
}
