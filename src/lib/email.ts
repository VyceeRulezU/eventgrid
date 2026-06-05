import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export async function sendEmail(params: Record<string, unknown>) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS not configured. Set VITE_EMAILJS_* env vars.')
    return
  }
  await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY)
}

export async function sendTeamInvite(email: string, eventName: string, inviteLink: string) {
  await sendEmail({
    to_email: email,
    subject: `You're invited to ${eventName}`,
    message: `You have been invited to join the team for ${eventName}. Click the link below to accept:\n\n${inviteLink}\n\n- EventGrid Team`,
  })
}

export async function sendGuestNotification(email: string, eventName: string, details: string) {
  await sendEmail({
    to_email: email,
    subject: `You're invited to ${eventName}`,
    message: `You have been invited to ${eventName}.\n\n${details}\n\n- EventGrid Team`,
  })
}

export async function sendClientUpdate(email: string, eventName: string, message: string) {
  await sendEmail({
    to_email: email,
    subject: `Update on ${eventName}`,
    message: `${message}\n\n- EventGrid Team`,
  })
}
