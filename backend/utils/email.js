import nodemailer from 'nodemailer';

const {
  NOTIFY_EMAIL_USER,
  NOTIFY_EMAIL_PASS,
} = process.env;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: NOTIFY_EMAIL_USER,
    pass: NOTIFY_EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, text, html }) {
  if (!NOTIFY_EMAIL_USER || !NOTIFY_EMAIL_PASS) {
    console.warn('[sendEmail] SMTP config missing; skipping email to', to);
    return;
  }
  const mailOptions = {
    from: NOTIFY_EMAIL_USER,
    to,
    subject,
    text,
    html,
  };
  await transporter.sendMail(mailOptions);
}