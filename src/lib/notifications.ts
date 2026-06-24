import type { NavigateFunction } from 'react-router-dom'
import { supabase } from './supabase'
import type { Notification } from '@/types'

export type NotificationEventType =
  | 'task_assigned'
  | 'task_overdue'
  | 'task_completed'
  | 'issue_raised'
  | 'issue_resolved'
  | 'vendor_update'
  | 'vendor_confirmed'
  | 'payment_received'
  | 'payment_overdue'
  | 'feedback_reply'
  | 'client_action_required'
  | 'mention'

export interface NotificationEvent {
  type: NotificationEventType
  recipientId: string
  eventId?: string
  payload: {
    title: string
    body?: string
    url?: string
    tag?: string
  }
}

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
      case 'mention':
        navigate(`/events/${n.event_id}/live-board`)
        return
    }
  }
  switch (n.type) {
    case 'feedback_reply':
      navigate('/notifications')
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

async function sendWebPush(event: NotificationEvent) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_enabled, push_tasks, push_issues, push_vendors, push_payments, push_client_actions')
      .eq('id', event.recipientId)
      .single()

    if (!profile) return
    if (!profile.push_enabled) return

    // Check specific preference based on notification type
    const pushPrefMap: Record<NotificationEventType, keyof typeof profile> = {
      task_assigned: 'push_tasks',
      task_overdue: 'push_tasks',
      task_completed: 'push_tasks',
      issue_raised: 'push_issues',
      issue_resolved: 'push_issues',
      vendor_update: 'push_vendors',
      vendor_confirmed: 'push_vendors',
      payment_received: 'push_payments',
      payment_overdue: 'push_payments',
      feedback_reply: 'push_client_actions',
      client_action_required: 'push_client_actions',
      mention: 'push_client_actions',
    }

    const prefKey = pushPrefMap[event.type]
    if (!profile[prefKey]) return

    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: event.recipientId,
        title: event.payload.title,
        body: event.payload.body || '',
        url: event.payload.url || '/',
        tag: event.payload.tag || event.type,
      },
    })

    if (error) console.error('sendWebPush error:', error)
  } catch (err) {
    console.error('sendWebPush exception:', err)
  }
}

export async function notify(event: NotificationEvent) {
  await createNotification(
    event.recipientId,
    event.type,
    event.payload.title,
    event.payload.body,
    event.eventId,
  )

  await sendWebPush(event)
}

/**
 * Send only web push notification (no in-app notification).
 * Use this when a DB trigger already creates the in-app notification
 * (e.g. task_assigned, issue_raised, issue_resolved have DB triggers).
 */
export async function sendPushNotification(event: NotificationEvent) {
  await sendWebPush(event)
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
