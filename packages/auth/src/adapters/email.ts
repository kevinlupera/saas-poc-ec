import { createTransport } from 'nodemailer'

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export type SendEmail = (message: EmailMessage) => Promise<void>

/** Production: Resend HTTP API. One request does not justify the SDK. */
export function resendSender({ apiKey, from }: { apiKey: string; from: string }): SendEmail {
  return async (message) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, ...message }),
    })
    // Status only: the body may echo the recipient.
    if (!response.ok) throw new Error(`Resend rejected the email: HTTP ${response.status}`)
  }
}

/** Local development and tests: plain SMTP to Mailpit, no TLS or auth. */
export function smtpSender({ host, port, from }: { host: string; port: number; from: string }): SendEmail {
  const transport = createTransport({ host, port, secure: false, ignoreTLS: true })
  return async (message) => {
    await transport.sendMail({ from, ...message })
  }
}
