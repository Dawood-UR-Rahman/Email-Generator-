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
  isDefault: boolean;
  retentionDays: number;
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

// Blog Post Schema
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  author: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const insertBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional().default(""),
  featuredImage: z.string().optional().default(""),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  metaKeywords: z.string().optional().default(""),
  isPublished: z.boolean().default(false),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// Page Content Schema (for Privacy, Terms, Contact, Homepage)
export interface PageContent {
  _id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: Date;
}

export const insertPageContentSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export type InsertPageContent = z.infer<typeof insertPageContentSchema>;

// Ad Snippet Schema
export interface AdSnippet {
  _id: string;
  name: string;
  position: "header" | "sidebar" | "content" | "footer";
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const insertAdSnippetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.enum(["header", "sidebar", "content", "footer"]),
  code: z.string().min(1, "Ad code is required"),
  isActive: z.boolean().default(true),
});

export type InsertAdSnippet = z.infer<typeof insertAdSnippetSchema>;

// App Settings Schema
export interface AppSettings {
  _id: string;
  defaultRetentionDays: number;
  emailSyncIntervalSeconds: number;
  soundNotificationsEnabled: boolean;
  updatedAt: Date;
}

export const appSettingsSchema = z.object({
  defaultRetentionDays: z.number().min(1).max(30).default(5),
  emailSyncIntervalSeconds: z.number().min(5).max(60).default(10),
  soundNotificationsEnabled: z.boolean().default(true),
});

export type InsertAppSettings = z.infer<typeof appSettingsSchema>;

// Site Settings Schema (General settings)
export interface SiteSettings {
  _id: string;
  siteName: string;
  siteLogo: string;
  headerLogo: string;
  footerLogo: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  footerText: string;
  copyrightText: string;
  socialLinks: SocialLinks;
  contactEmail: string;
  updatedAt: Date;
}

export interface SocialLinks {
  twitter: string;
  github: string;
  linkedin: string;
  facebook: string;
}

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required").default("TempMail"),
  siteLogo: z.string().optional().default(""),
  headerLogo: z.string().optional().default(""),
  footerLogo: z.string().optional().default(""),
  defaultMetaTitle: z.string().optional().default("TempMail - Free Temporary Email Service"),
  defaultMetaDescription: z.string().optional().default("Create disposable email addresses instantly. Protect your privacy with our free temporary email service."),
  footerText: z.string().optional().default("Free temporary email addresses for protecting your privacy online. No registration required."),
  copyrightText: z.string().optional().default("All rights reserved."),
  socialLinks: z.object({
    twitter: z.string().optional().default(""),
    github: z.string().optional().default(""),
    linkedin: z.string().optional().default(""),
    facebook: z.string().optional().default(""),
  }).optional().default({}),
  contactEmail: z.string().email().optional().or(z.literal("")).default(""),
});

export type InsertSiteSettings = z.infer<typeof siteSettingsSchema>;

// Contact Form Submission Schema
export interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export const contactSubmissionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type InsertContactSubmission = z.infer<typeof contactSubmissionSchema>;

// Homepage Content Schema
export interface HomepageContent {
  _id: string;
  faqItems: FAQItem[];
  statsContent: StatsContent;
  heroContent: HeroContent;
  updatedAt: Date;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface StatsContent {
  emailsCreatedLabel: string;
  messagesReceivedLabel: string;
  activeUsersLabel: string;
  uptimeLabel: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  generateButtonText: string;
}

export const homepageContentSchema = z.object({
  faqItems: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  statsContent: z.object({
    emailsCreatedLabel: z.string(),
    messagesReceivedLabel: z.string(),
    activeUsersLabel: z.string(),
    uptimeLabel: z.string(),
  }).optional(),
  heroContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    generateButtonText: z.string(),
  }).optional(),
});

export type InsertHomepageContent = z.infer<typeof homepageContentSchema>;

// Email Template Schema
export interface EmailTemplate {
  _id: string;
  type: "welcome" | "forgot_password" | "contact_notification" | "newsletter_confirmation";
  name: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const emailTemplateSchema = z.object({
  type: z.enum(["welcome", "forgot_password", "contact_notification", "newsletter_confirmation"]),
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  isActive: z.boolean().default(true),
});

export type InsertEmailTemplate = z.infer<typeof emailTemplateSchema>;

// Newsletter Subscriber Schema
export interface NewsletterSubscriber {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

export const newsletterSubscriberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type InsertNewsletterSubscriber = z.infer<typeof newsletterSubscriberSchema>;

// Domain Instructions Schema (Admin configurable)
export interface DomainInstructions {
  _id: string;
  content: string;
  updatedAt: Date;
}

export const domainInstructionsSchema = z.object({
  content: z.string().min(1, "Instructions content is required"),
});

export type InsertDomainInstructions = z.infer<typeof domainInstructionsSchema>;

// Storage Settings Schema (Database cleanup settings)
export interface StorageSettings {
  _id: string;
  autoDeleteEnabled: boolean;
  autoDeleteDays: number;
  maxStorageEmails: number;
  maxStorageMessages: number;
  updatedAt: Date;
}

export const storageSettingsSchema = z.object({
  autoDeleteEnabled: z.boolean().default(true),
  autoDeleteDays: z.number().min(1).max(365).default(7),
  maxStorageEmails: z.number().min(100).max(1000000).default(10000),
  maxStorageMessages: z.number().min(100).max(1000000).default(50000),
});

export type InsertStorageSettings = z.infer<typeof storageSettingsSchema>;

// Domain Limits Schema (Custom domain limits for free users)
export interface DomainLimits {
  _id: string;
  maxFreeCustomDomains: number;
  limitMessage: string;
  updatedAt: Date;
}

export const domainLimitsSchema = z.object({
  maxFreeCustomDomains: z.number().min(0).max(100).default(1),
  limitMessage: z.string().default("Please purchase a plan to add more custom domains and create permanent email addresses."),
});

export type InsertDomainLimits = z.infer<typeof domainLimitsSchema>;

// API Response types
export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
