import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetToken: String,
  resetTokenExpiry: Date,
}, { timestamps: true });

const DomainSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ["system", "custom"], default: "custom" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isVerified: { type: Boolean, default: false },
  verificationTxt: String,
  dnsStatus: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  retentionDays: { type: Number, default: 5 },
}, { timestamps: true });

const MailboxSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  domain: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isPublic: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  mailboxId: { type: mongoose.Schema.Types.ObjectId, ref: "Mailbox", required: true },
  mailboxEmail: { type: String, required: true },
  from: { type: String, required: true },
  fromName: String,
  to: { type: String, required: true },
  subject: { type: String, required: true },
  textBody: String,
  htmlBody: String,
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    content: String,
  }],
  isRead: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const ImapSettingsSchema = new mongoose.Schema({
  host: { type: String, required: true },
  port: { type: Number, required: true },
  user: { type: String, required: true },
  password: { type: String, required: true },
  tls: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastSync: Date,
}, { timestamps: true });

const SmtpSettingsSchema = new mongoose.Schema({
  host: { type: String, required: true },
  port: { type: Number, required: true },
  user: { type: String, required: true },
  password: { type: String, required: true },
  secure: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
  isRead: { type: Boolean, default: false },
  isGlobal: { type: Boolean, default: false },
}, { timestamps: true });

const LogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  details: String,
  level: { type: String, enum: ["info", "warning", "error"], default: "info" },
}, { timestamps: true });

const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: "" },
  featuredImage: { type: String, default: "" },
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  metaKeywords: { type: String, default: "" },
  author: { type: String, default: "Admin" },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

const PageContentSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const AdSnippetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, enum: ["header", "sidebar", "content", "footer"], required: true },
  code: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const AppSettingsSchema = new mongoose.Schema({
  defaultRetentionDays: { type: Number, default: 5 },
  emailSyncIntervalSeconds: { type: Number, default: 10 },
  soundNotificationsEnabled: { type: Boolean, default: true },
}, { timestamps: true });

const SiteSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "TempMail" },
  siteLogo: { type: String, default: "" },
  headerLogo: { type: String, default: "" },
  footerLogo: { type: String, default: "" },
  defaultMetaTitle: { type: String, default: "TempMail - Free Temporary Email Service" },
  defaultMetaDescription: { type: String, default: "Create disposable email addresses instantly. Protect your privacy with our free temporary email service." },
  footerText: { type: String, default: "Free temporary email addresses for protecting your privacy online. No registration required." },
  copyrightText: { type: String, default: "All rights reserved." },
  socialLinks: {
    twitter: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    facebook: { type: String, default: "" },
  },
  contactEmail: { type: String, default: "" },
}, { timestamps: true });

const ContactSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const HomepageContentSchema = new mongoose.Schema({
  faqItems: [{
    question: String,
    answer: String,
  }],
  statsContent: {
    emailsCreatedLabel: { type: String, default: "Emails Created" },
    messagesReceivedLabel: { type: String, default: "Messages Received" },
    activeUsersLabel: { type: String, default: "Active Users" },
    uptimeLabel: { type: String, default: "Uptime" },
  },
  heroContent: {
    title: { type: String, default: "Instant Temporary Email" },
    subtitle: { type: String, default: "Protect your privacy with disposable email addresses" },
    generateButtonText: { type: String, default: "Generate Email Address" },
  },
}, { timestamps: true });

const EmailTemplateSchema = new mongoose.Schema({
  type: { type: String, enum: ["welcome", "forgot_password", "contact_notification", "newsletter_confirmation"], required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const NewsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const DomainInstructionsSchema = new mongoose.Schema({
  content: { type: String, required: true, default: `<ol class="space-y-3 text-sm text-muted-foreground">
    <li class="flex items-start gap-2">
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">1</span>
      <span>Add your domain using the form above</span>
    </li>
    <li class="flex items-start gap-2">
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">2</span>
      <span>Copy the TXT verification record provided</span>
    </li>
    <li class="flex items-start gap-2">
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">3</span>
      <span>Add the TXT record to your domain's DNS settings</span>
    </li>
    <li class="flex items-start gap-2">
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">4</span>
      <span>Add an MX record pointing to our mail server</span>
    </li>
    <li class="flex items-start gap-2">
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">5</span>
      <span>Wait for verification (usually within 24 hours)</span>
    </li>
  </ol>` },
}, { timestamps: true });

const StorageSettingsSchema = new mongoose.Schema({
  autoDeleteEnabled: { type: Boolean, default: true },
  autoDeleteDays: { type: Number, default: 7 },
  maxStorageEmails: { type: Number, default: 10000 },
  maxStorageMessages: { type: Number, default: 50000 },
}, { timestamps: true });

const DomainLimitsSchema = new mongoose.Schema({
  maxFreeCustomDomains: { type: Number, default: 1 },
  limitMessage: { type: String, default: "Please purchase a plan to add more custom domains and create permanent email addresses." },
}, { timestamps: true });

export const User = mongoose.model("User", UserSchema);
export const Domain = mongoose.model("Domain", DomainSchema);
export const Mailbox = mongoose.model("Mailbox", MailboxSchema);
export const Message = mongoose.model("Message", MessageSchema);
export const ImapSettings = mongoose.model("ImapSettings", ImapSettingsSchema);
export const SmtpSettings = mongoose.model("SmtpSettings", SmtpSettingsSchema);
export const Notification = mongoose.model("Notification", NotificationSchema);
export const Log = mongoose.model("Log", LogSchema);
export const BlogPost = mongoose.model("BlogPost", BlogPostSchema);
export const PageContent = mongoose.model("PageContent", PageContentSchema);
export const AdSnippet = mongoose.model("AdSnippet", AdSnippetSchema);
export const AppSettings = mongoose.model("AppSettings", AppSettingsSchema);
export const SiteSettings = mongoose.model("SiteSettings", SiteSettingsSchema);
export const ContactSubmission = mongoose.model("ContactSubmission", ContactSubmissionSchema);
export const HomepageContent = mongoose.model("HomepageContent", HomepageContentSchema);
export const EmailTemplate = mongoose.model("EmailTemplate", EmailTemplateSchema);
export const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
export const DomainInstructions = mongoose.model("DomainInstructions", DomainInstructionsSchema);
export const StorageSettings = mongoose.model("StorageSettings", StorageSettingsSchema);
export const DomainLimits = mongoose.model("DomainLimits", DomainLimitsSchema);
