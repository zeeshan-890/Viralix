const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendEmail({ to, subject, html, text }) {
    if (!process.env.SMTP_HOST) {
        console.warn('SMTP not configured; skipping email to', to);
        return { skipped: true };
    }
    const from = process.env.MAIL_FROM || `Viralix <no-reply@viralix.ai>`;
    return transporter.sendMail({ from, to, subject, html, text });
}

function otpTemplate(code) {
    return {
        subject: 'Your Viralix verification code',
        text: `Your verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`
    };
}

module.exports = { sendEmail, otpTemplate };
