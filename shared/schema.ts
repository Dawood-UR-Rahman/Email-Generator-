import { z } from "zod";

// User Schema
export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Domain Schema
export interface Domain {
  _id: string;
  name: string;
  type: "system" | "custom";
  userId?: string;
  isVerified: boolean;
  verificationTxt?: string;
  dnsStatus?: "pending" | "verified" | "failed";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const insertDomainSchema = z.object({
  name: z.string().min(3, "Domain name is required").regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
});

export type InsertDomain = z.infer<typeof insertDomainSchema>;

// Mailbox Schema
export interface Mailbox {
  _id: string;
  email: string;
  domain: string;
  userId?: string;
  isPublic: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export const insertMailboxSchema = z.object({
  email: z.string().email("Invalid email format"),
  domain: z.string(),
});

export type InsertMailbox = z.infer<typeof insertMailboxSchema>;

// Message Schema
export interface Message {
  _id: string;
  mailboxId: string;
  mailboxEmail: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  attachments?: Attachment[];
  isRead: boolean;
  receivedAt: Date;
  createdAt: Date;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content?: string;
}

// IMAP Settings Schema
export interface ImapSettings {
  _id: string;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  isActive: boolean;
  lastSync?: Date;
  updatedAt: Date;
}

export const imapSettingsSchema = z.object({
  host: z.string().min(1, "IMAP host is required"),
  port: z.number().min(1).max(65535),
  user: z.string().min(1, "IMAP user is required"),
  password: z.string().min(1, "IMAP password is required"),
  tls: z.boolean().default(true),
});

export type InsertImapSettings = z.infer<typeof imapSettingsSchema>;

// SMTP Settings Schema
export interface SmtpSettings {
  _id: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  isActive: boolean;
  updatedAt: Date;
}

export const smtpSettingsSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().min(1).max(65535),
  user: z.string().min(1, "SMTP user is required"),
  password: z.string().min(1, "SMTP password is required"),
  secure: z.boolean().default(true),
});

export type InsertSmtpSettings = z.infer<typeof smtpSettingsSchema>;

// Notification Schema
export interface Notification {
  _id: string;
  userId?: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  isGlobal: boolean;
  createdAt: Date;
}

export const insertNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["info", "warning", "success", "error"]).default("info"),
  userId: z.string().optional(),
  isGlobal: z.boolean().default(false),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Log Schema
export interface Log {
  _id: string;
  action: string;
  userId?: string;
  details?: string;
  level: "info" | "warning" | "error";
  createdAt: Date;
}

// Stats interface
export interface Stats {
  emailsCreated: number;
  messagesReceived: number;
  activeUsers: number;
  activeDomains: number;
}

// API Response types
export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
