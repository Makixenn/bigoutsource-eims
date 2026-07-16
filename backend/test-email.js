import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mailpit',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('Sending email...');
    let info = await transporter.sendMail({
      from: process.env.SMTP_USER || 'test@example.com',
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email'
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

test();
