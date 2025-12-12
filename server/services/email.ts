import nodemailer from "nodemailer";
import { SmtpSettings } from "../models/index";

let transporter: nodemailer.Transporter | null = null;

export async function initializeSmtp(): Promise<boolean> {
  try {
    const settings = await SmtpSettings.findOne({ isActive: true });
    
    if (!settings) {
      console.log("No active SMTP settings found");
      return false;
    }

    transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.password,
      },
    });

    await transporter.verify();
    console.log("SMTP connection verified");
    return true;
  } catch (error) {
    console.error("SMTP initialization failed:", error);
    return false;
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> {
  if (!transporter) {
    await initializeSmtp();
  }

  if (!transporter) {
    console.error("SMTP not configured");
    return false;
  }

  try {
    const settings = await SmtpSettings.findOne({ isActive: true });
    
    await transporter.sendMail({
      from: settings?.user || "noreply@tempmail.io",
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = `${process.env.APP_URL || "http://localhost:5000"}/verify-email?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: "Verify Your Email - TempMail",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Welcome to TempMail!</h1>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">
          If you didn't create an account with TempMail, please ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: "Reset Your Password - TempMail",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `,
  });
}

export async function testSmtpConnection(): Promise<boolean> {
  if (!transporter) {
    await initializeSmtp();
  }

  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
