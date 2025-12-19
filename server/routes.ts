import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import { connectDB, isDBConnected } from "./db";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});
import { User, Domain, Mailbox, Message, ImapSettings, SmtpSettings, Notification, Log, BlogPost, PageContent, AdSnippet, AppSettings, SiteSettings, ContactSubmission, HomepageContent, EmailTemplate, NewsletterSubscriber, DomainInstructions, StorageSettings, DomainLimits } from "./models/index";
import { authMiddleware, adminMiddleware, optionalAuthMiddleware, generateToken, AuthRequest } from "./middleware/auth";
import { sendVerificationEmail, sendPasswordResetEmail, testSmtpConnection, sendTestEmail, sendWelcomeEmail, sendContactNotification, sendNewsletterConfirmation } from "./services/email";
import { testImapConnection } from "./services/imap";
import { startCronJobs } from "./services/cron";
import { insertUserSchema, loginSchema, insertDomainSchema, imapSettingsSchema, smtpSettingsSchema, insertBlogPostSchema, insertPageContentSchema, insertAdSnippetSchema, appSettingsSchema, siteSettingsSchema, contactSubmissionSchema, homepageContentSchema, resetPasswordSchema, emailTemplateSchema, newsletterSubscriberSchema, domainInstructionsSchema, storageSettingsSchema, domainLimitsSchema } from "@shared/schema";

const DEFAULT_DOMAINS = ["tempmail.io", "quickmail.dev", "disposable.cc"];

async function seedDefaultDomains(): Promise<void> {
  for (let i = 0; i < DEFAULT_DOMAINS.length; i++) {
    const domainName = DEFAULT_DOMAINS[i];
    await Domain.findOneAndUpdate(
      { name: domainName },
      { 
        $setOnInsert: {
          name: domainName,
          type: "system",
          isVerified: true,
          isActive: true,
          isDefault: i === 0,
          retentionDays: 5,
        }
      },
      { upsert: true }
    );
  }
  
  const hasDefault = await Domain.findOne({ isDefault: true });
  if (!hasDefault) {
    await Domain.findOneAndUpdate({}, { isDefault: true });
  }
  
  const existingSettings = await AppSettings.findOne();
  if (!existingSettings) {
    await AppSettings.create({
      defaultRetentionDays: 5,
      emailSyncIntervalSeconds: 10,
      soundNotificationsEnabled: true,
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectDB();
  
  if (isDBConnected()) {
    await seedDefaultDomains();
    startCronJobs();
  }

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      db: isDBConnected() ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  // Serve uploaded files
  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  // Image upload endpoint
  app.post("/api/admin/upload", authMiddleware as any, adminMiddleware as any, upload.single("image"), (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }

      const { username, email, password } = parsed.data;

      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = uuidv4();

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        verificationToken,
        isVerified: true,
      });

      const token = generateToken(user._id.toString());

      await Log.create({
        action: "User registered",
        userId: user._id,
        details: `User ${username} registered`,
        level: "info",
      });

      // Send welcome email with site branding
      try {
        const siteSettings = await SiteSettings.findOne();
        const siteName = siteSettings?.siteName || "TempMail";
        const siteLogo = siteSettings?.siteLogo || "";
        await sendWelcomeEmail(email, username, siteName, siteLogo);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { email, password } = parsed.data;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user._id.toString());

      await Log.create({
        action: "User login",
        userId: user._id,
        details: `User ${user.username} logged in`,
        level: "info",
      });

      res.json({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }

      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await User.findByIdAndUpdate(user._id, { resetToken, resetTokenExpiry });

      await sendPasswordResetEmail(email, resetToken);

      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.get("/api/domains", optionalAuthMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?._id;
      
      // Build query: system domains + user's own custom domains (if logged in)
      const query: any = { 
        isActive: true,
        $or: [
          { type: "system" },
          { type: "custom", isVerified: true, userId: userId }
        ]
      };
      
      // If not logged in, only show system domains
      if (!userId) {
        query.$or = [{ type: "system" }];
      }
      
      const domains = await Domain.find(query)
        .select("-__v")
        .sort({ type: 1, name: 1 });

      res.json(domains);
    } catch (error) {
      console.error("Get domains error:", error);
      res.json(DEFAULT_DOMAINS.map((name, i) => ({
        _id: String(i),
        name,
        type: "system",
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })));
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const [emailsCreated, messagesReceived, activeUsers, activeDomains] = await Promise.all([
        Mailbox.countDocuments(),
        Message.countDocuments(),
        User.countDocuments({ isVerified: true }),
        Domain.countDocuments({ isActive: true }),
      ]);

      res.json({
        emailsCreated: emailsCreated || 12458,
        messagesReceived: messagesReceived || 45872,
        activeUsers: activeUsers || 100,
        activeDomains: activeDomains || 3,
      });
    } catch (error) {
      res.json({
        emailsCreated: 12458,
        messagesReceived: 45872,
        activeUsers: 100,
        activeDomains: 3,
      });
    }
  });

  app.post("/api/mailbox/create", optionalAuthMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { email, domain } = req.body;

      if (!email || !domain) {
        return res.status(400).json({ message: "Email and domain are required" });
      }

      const existingMailbox = await Mailbox.findOne({ email: email.toLowerCase() });
      if (existingMailbox) {
        return res.json(existingMailbox);
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 5);

      const mailbox = await Mailbox.create({
        email: email.toLowerCase(),
        domain,
        userId: req.user?._id,
        isPublic: !req.user,
        expiresAt,
      });

      res.status(201).json(mailbox);
    } catch (error) {
      console.error("Create mailbox error:", error);
      res.status(500).json({ message: "Failed to create mailbox" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email parameter is required" });
      }

      const messages = await Message.find({ mailboxEmail: email.toLowerCase() })
        .sort({ receivedAt: -1 })
        .limit(50);

      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.json([]);
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await Message.findByIdAndDelete(id);
      res.json({ message: "Message deleted" });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.delete("/api/mailbox/delete", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const mailbox = await Mailbox.findOne({ email: email.toLowerCase() });
      if (mailbox) {
        await Message.deleteMany({ mailboxId: mailbox._id });
        await Mailbox.findByIdAndDelete(mailbox._id);
      }

      res.json({ message: "Mailbox deleted" });
    } catch (error) {
      console.error("Delete mailbox error:", error);
      res.status(500).json({ message: "Failed to delete mailbox" });
    }
  });

  app.post("/api/domain/add", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const parsed = insertDomainSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid domain format" });
      }

      const { name } = parsed.data;

      const existingDomain = await Domain.findOne({ name: name.toLowerCase() });
      if (existingDomain) {
        return res.status(400).json({ message: "Domain already exists" });
      }

      const verificationTxt = `tempmail-verify=${uuidv4()}`;

      const domain = await Domain.create({
        name: name.toLowerCase(),
        type: "custom",
        userId: req.user!._id,
        verificationTxt,
        dnsStatus: "pending",
      });

      await Log.create({
        action: "Domain added",
        userId: req.user!._id,
        details: `Domain ${name} added`,
        level: "info",
      });

      res.status(201).json(domain);
    } catch (error) {
      console.error("Add domain error:", error);
      res.status(500).json({ message: "Failed to add domain" });
    }
  });

  app.get("/api/domain/status/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const domain = await Domain.findById(id);

      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      res.json({
        isVerified: domain.isVerified,
        dnsStatus: domain.dnsStatus,
      });
    } catch (error) {
      console.error("Get domain status error:", error);
      res.status(500).json({ message: "Failed to get domain status" });
    }
  });

  app.delete("/api/domain/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const domain = await Domain.findById(id);

      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      if (domain.userId?.toString() !== req.user!._id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      await Domain.findByIdAndDelete(id);

      res.json({ message: "Domain deleted" });
    } catch (error) {
      console.error("Delete domain error:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  app.get("/api/user/domains", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const domains = await Domain.find({ userId: req.user!._id });
      res.json(domains);
    } catch (error) {
      console.error("Get user domains error:", error);
      res.json([]);
    }
  });

  app.get("/api/user/notifications", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const notifications = await Notification.find({
        $or: [{ userId: req.user!._id }, { isGlobal: true }],
      }).sort({ createdAt: -1 }).limit(50);

      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.json([]);
    }
  });

  app.get("/api/admin/users", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const users = await User.find().select("-password").sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.json([]);
    }
  });

  app.post("/api/admin/users/:id/toggle", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      await User.findByIdAndUpdate(id, { isVerified: isActive });
      res.json({ message: "User updated" });
    } catch (error) {
      console.error("Toggle user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.put("/api/admin/users/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, role } = req.body;

      await User.findByIdAndUpdate(id, { username, email, role });
      res.json({ message: "User updated" });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { id } = req.params;
      await User.findByIdAndDelete(id);
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/admin/users/:id/login-as", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const token = generateToken(user._id.toString());
      res.json({ 
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        }
      });
    } catch (error) {
      console.error("Login as user error:", error);
      res.status(500).json({ message: "Failed to login as user" });
    }
  });

  app.get("/api/admin/domains", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const domains = await Domain.find().sort({ createdAt: -1 });
      res.json(domains);
    } catch (error) {
      console.error("Get all domains error:", error);
      res.json([]);
    }
  });

  app.post("/api/admin/domains/:id/approve", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { id } = req.params;
      await Domain.findByIdAndUpdate(id, { isVerified: true, dnsStatus: "verified" });
      res.json({ message: "Domain approved" });
    } catch (error) {
      console.error("Approve domain error:", error);
      res.status(500).json({ message: "Failed to approve domain" });
    }
  });

  app.delete("/api/admin/domains/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { id } = req.params;
      await Domain.findByIdAndDelete(id);
      res.json({ message: "Domain deleted" });
    } catch (error) {
      console.error("Delete domain error:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  app.post("/api/admin/settings/imap", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = imapSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid IMAP settings" });
      }

      await ImapSettings.deleteMany({});
      const settings = await ImapSettings.create(parsed.data);

      await Log.create({
        action: "IMAP settings updated",
        details: `Host: ${parsed.data.host}`,
        level: "info",
      });

      res.json(settings);
    } catch (error) {
      console.error("Save IMAP settings error:", error);
      res.status(500).json({ message: "Failed to save IMAP settings" });
    }
  });

  app.post("/api/admin/settings/smtp", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = smtpSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid SMTP settings" });
      }

      await SmtpSettings.deleteMany({});
      const settings = await SmtpSettings.create(parsed.data);

      await Log.create({
        action: "SMTP settings updated",
        details: `Host: ${parsed.data.host}`,
        level: "info",
      });

      res.json(settings);
    } catch (error) {
      console.error("Save SMTP settings error:", error);
      res.status(500).json({ message: "Failed to save SMTP settings" });
    }
  });

  app.post("/api/admin/test/imap", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const success = await testImapConnection();
      if (success) {
        res.json({ message: "IMAP connection successful" });
      } else {
        res.status(400).json({ message: "IMAP connection failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "IMAP test failed" });
    }
  });

  app.post("/api/admin/test/smtp", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const success = await testSmtpConnection();
      if (success) {
        res.json({ message: "SMTP connection successful" });
      } else {
        res.status(400).json({ message: "SMTP connection failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "SMTP test failed" });
    }
  });

  app.get("/api/admin/logs", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const logs = await Log.find().sort({ createdAt: -1 }).limit(100);
      res.json(logs);
    } catch (error) {
      console.error("Get logs error:", error);
      res.json([]);
    }
  });

  app.post("/api/admin/notifications", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { title, message, type, userId, isGlobal } = req.body;

      const notification = await Notification.create({
        title,
        message,
        type: type || "info",
        userId,
        isGlobal: isGlobal || false,
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Domain Management Routes
  app.post("/api/admin/domains", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = insertDomainSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid domain", errors: parsed.error.flatten() });
      }

      const existing = await Domain.findOne({ name: parsed.data.name });
      if (existing) {
        return res.status(400).json({ message: "Domain already exists" });
      }

      const domain = await Domain.create({
        name: parsed.data.name,
        type: "system",
        isVerified: true,
        isActive: true,
        isDefault: false,
        retentionDays: 5,
      });

      await Log.create({ action: "Domain created", details: parsed.data.name, level: "info" });
      res.status(201).json(domain);
    } catch (error) {
      console.error("Create domain error:", error);
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.delete("/api/admin/domains/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const domain = await Domain.findById(req.params.id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      if (domain.isDefault) {
        return res.status(400).json({ message: "Cannot delete default domain" });
      }
      await Domain.findByIdAndDelete(req.params.id);
      await Log.create({ action: "Domain deleted", details: domain.name, level: "info" });
      res.json({ message: "Domain deleted" });
    } catch (error) {
      console.error("Delete domain error:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  app.put("/api/admin/domains/:id/default", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      await Domain.updateMany({}, { isDefault: false });
      const domain = await Domain.findByIdAndUpdate(req.params.id, { isDefault: true }, { new: true });
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      await Log.create({ action: "Default domain changed", details: domain.name, level: "info" });
      res.json(domain);
    } catch (error) {
      console.error("Set default domain error:", error);
      res.status(500).json({ message: "Failed to set default domain" });
    }
  });

  app.put("/api/admin/domains/:id/retention", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { retentionDays } = req.body;
      const domain = await Domain.findByIdAndUpdate(req.params.id, { retentionDays }, { new: true });
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      res.json(domain);
    } catch (error) {
      console.error("Update retention error:", error);
      res.status(500).json({ message: "Failed to update retention" });
    }
  });

  // Blog Routes
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await BlogPost.find({ isPublished: true }).sort({ createdAt: -1 });
      res.json(posts);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to get post" });
    }
  });

  app.get("/api/admin/blog", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const posts = await BlogPost.find().sort({ createdAt: -1 });
      res.json(posts);
    } catch (error) {
      res.json([]);
    }
  });

  app.post("/api/admin/blog", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = insertBlogPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid blog post", errors: parsed.error.flatten() });
      }
      const post = await BlogPost.create({ ...parsed.data, author: "Admin" });
      res.status(201).json(post);
    } catch (error) {
      console.error("Create blog post error:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put("/api/admin/blog/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Update blog post error:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      await BlogPost.findByIdAndDelete(req.params.id);
      res.json({ message: "Post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Page Content Routes
  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const page = await PageContent.findOne({ slug: req.params.slug });
      if (!page) {
        return res.json({ slug: req.params.slug, title: req.params.slug, content: "" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to get page" });
    }
  });

  app.get("/api/admin/pages", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const pages = await PageContent.find();
      res.json(pages);
    } catch (error) {
      res.json([]);
    }
  });

  app.put("/api/admin/pages/:slug", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = insertPageContentSchema.safeParse({ slug: req.params.slug, ...req.body });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid page content", errors: parsed.error.flatten() });
      }
      const page = await PageContent.findOneAndUpdate(
        { slug: req.params.slug },
        parsed.data,
        { upsert: true, new: true }
      );
      res.json(page);
    } catch (error) {
      console.error("Update page error:", error);
      res.status(500).json({ message: "Failed to update page" });
    }
  });

  // Ad Snippet Routes
  app.get("/api/ads", async (req, res) => {
    try {
      const ads = await AdSnippet.find({ isActive: true });
      res.json(ads);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/admin/ads", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const ads = await AdSnippet.find();
      res.json(ads);
    } catch (error) {
      res.json([]);
    }
  });

  app.post("/api/admin/ads", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = insertAdSnippetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid ad snippet", errors: parsed.error.flatten() });
      }
      const ad = await AdSnippet.create(parsed.data);
      res.status(201).json(ad);
    } catch (error) {
      console.error("Create ad error:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  app.put("/api/admin/ads/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const ad = await AdSnippet.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }
      res.json(ad);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ad" });
    }
  });

  app.delete("/api/admin/ads/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      await AdSnippet.findByIdAndDelete(req.params.id);
      res.json({ message: "Ad deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ad" });
    }
  });

  // App Settings Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await AppSettings.findOne();
      res.json(settings || { defaultRetentionDays: 5, emailSyncIntervalSeconds: 10, soundNotificationsEnabled: true });
    } catch (error) {
      res.json({ defaultRetentionDays: 5, emailSyncIntervalSeconds: 10, soundNotificationsEnabled: true });
    }
  });

  app.put("/api/admin/settings", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = appSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid settings", errors: parsed.error.flatten() });
      }
      const settings = await AppSettings.findOneAndUpdate({}, parsed.data, { upsert: true, new: true });
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Site Settings Routes
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await SiteSettings.findOne();
      res.json(settings || { 
        siteName: "TempMail", 
        siteLogo: "", 
        defaultMetaTitle: "TempMail - Free Temporary Email Service",
        defaultMetaDescription: "Create disposable email addresses instantly." 
      });
    } catch (error) {
      res.json({ siteName: "TempMail", siteLogo: "", defaultMetaTitle: "", defaultMetaDescription: "" });
    }
  });

  app.get("/api/admin/site-settings", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const settings = await SiteSettings.findOne();
      res.json(settings || { siteName: "TempMail", siteLogo: "", defaultMetaTitle: "", defaultMetaDescription: "" });
    } catch (error) {
      res.json({ siteName: "TempMail", siteLogo: "", defaultMetaTitle: "", defaultMetaDescription: "" });
    }
  });

  app.put("/api/admin/site-settings", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = siteSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid settings", errors: parsed.error.flatten() });
      }
      const settings = await SiteSettings.findOneAndUpdate({}, parsed.data, { upsert: true, new: true });
      await Log.create({ action: "Site settings updated", level: "info" });
      res.json(settings);
    } catch (error) {
      console.error("Update site settings error:", error);
      res.status(500).json({ message: "Failed to update site settings" });
    }
  });

  // Contact Form Routes
  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = contactSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid submission", errors: parsed.error.flatten() });
      }
      const submission = await ContactSubmission.create(parsed.data);
      
      // Send notification email to admin (don't block response)
      sendContactNotification({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      }).catch(err => console.error("Failed to send contact notification:", err));
      
      res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/admin/contacts", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const contacts = await ContactSubmission.find().sort({ createdAt: -1 });
      res.json(contacts);
    } catch (error) {
      res.json([]);
    }
  });

  app.put("/api/admin/contacts/:id/read", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      await ContactSubmission.findByIdAndUpdate(req.params.id, { isRead: true });
      res.json({ message: "Marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.delete("/api/admin/contacts/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      await ContactSubmission.findByIdAndDelete(req.params.id);
      res.json({ message: "Contact deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Homepage Content Routes
  app.get("/api/homepage-content", async (req, res) => {
    try {
      const content = await HomepageContent.findOne();
      res.json(content || {
        faqItems: [
          { question: "What is a temporary email?", answer: "A temporary email is a disposable email address that you can use for a short period of time." },
          { question: "How long do emails last?", answer: "Emails are kept for 5 days by default, but this can be configured." },
          { question: "Is it free to use?", answer: "Yes, our service is completely free to use." },
        ],
        statsContent: {
          emailsCreatedLabel: "Emails Created",
          messagesReceivedLabel: "Messages Received",
          activeUsersLabel: "Active Users",
          uptimeLabel: "Uptime",
        },
        heroContent: {
          title: "Instant Temporary Email",
          subtitle: "Protect your privacy with disposable email addresses",
          generateButtonText: "Generate Email Address",
        },
      });
    } catch (error) {
      res.json({});
    }
  });

  app.get("/api/admin/homepage-content", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const content = await HomepageContent.findOne();
      res.json(content || {});
    } catch (error) {
      res.json({});
    }
  });

  app.put("/api/admin/homepage-content", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const content = await HomepageContent.findOneAndUpdate({}, req.body, { upsert: true, new: true });
      await Log.create({ action: "Homepage content updated", level: "info" });
      res.json(content);
    } catch (error) {
      console.error("Update homepage content error:", error);
      res.status(500).json({ message: "Failed to update homepage content" });
    }
  });

  // Send Test Email Route
  app.post("/api/admin/test/smtp/send", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      const success = await sendTestEmail(email);
      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(400).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Send test email error:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Password Reset Routes
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }

      const { token, password } = parsed.data;
      const user = await User.findOne({ 
        resetToken: token, 
        resetTokenExpiry: { $gt: new Date() } 
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword, 
        resetToken: null, 
        resetTokenExpiry: null 
      });

      await Log.create({
        action: "Password reset",
        userId: user._id,
        details: `User ${user.username} reset their password`,
        level: "info",
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Email Template Routes
  app.get("/api/admin/email-templates", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const templates = await EmailTemplate.find().sort({ type: 1 });
      res.json(templates);
    } catch (error) {
      console.error("Get email templates error:", error);
      res.json([]);
    }
  });

  app.get("/api/admin/email-templates/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const template = await EmailTemplate.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Get email template error:", error);
      res.status(500).json({ message: "Failed to get template" });
    }
  });

  app.post("/api/admin/email-templates", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = emailTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid template", errors: parsed.error.flatten() });
      }
      const template = await EmailTemplate.create(parsed.data);
      await Log.create({ action: "Email template created", details: parsed.data.name, level: "info" });
      res.status(201).json(template);
    } catch (error) {
      console.error("Create email template error:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/admin/email-templates/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = emailTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid template", errors: parsed.error.flatten() });
      }
      const template = await EmailTemplate.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      await Log.create({ action: "Email template updated", details: template.name, level: "info" });
      res.json(template);
    } catch (error) {
      console.error("Update email template error:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/admin/email-templates/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const template = await EmailTemplate.findByIdAndDelete(req.params.id);
      if (template) {
        await Log.create({ action: "Email template deleted", details: template.name, level: "info" });
      }
      res.json({ message: "Template deleted" });
    } catch (error) {
      console.error("Delete email template error:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Newsletter Subscription Routes
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const parsed = newsletterSubscriberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      const email = parsed.data.email.toLowerCase();
      const existingSubscriber = await NewsletterSubscriber.findOne({ email });
      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          return res.status(400).json({ message: "Email already subscribed" });
        }
        await NewsletterSubscriber.findByIdAndUpdate(existingSubscriber._id, { isActive: true });
        // Send confirmation email (don't block response)
        sendNewsletterConfirmation(email).catch(err => console.error("Failed to send newsletter confirmation:", err));
        return res.json({ message: "Subscription reactivated successfully" });
      }

      await NewsletterSubscriber.create({ email, isActive: true });
      // Send confirmation email (don't block response)
      sendNewsletterConfirmation(email).catch(err => console.error("Failed to send newsletter confirmation:", err));
      res.status(201).json({ message: "Successfully subscribed to newsletter" });
    } catch (error) {
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  app.post("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      await NewsletterSubscriber.findOneAndUpdate(
        { email: email.toLowerCase() },
        { isActive: false }
      );
      res.json({ message: "Successfully unsubscribed" });
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  app.get("/api/admin/newsletter-subscribers", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });
      res.json(subscribers);
    } catch (error) {
      console.error("Get newsletter subscribers error:", error);
      res.json([]);
    }
  });

  app.delete("/api/admin/newsletter-subscribers/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      await NewsletterSubscriber.findByIdAndDelete(req.params.id);
      res.json({ message: "Subscriber deleted" });
    } catch (error) {
      console.error("Delete newsletter subscriber error:", error);
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });

  // Contacts Export Route
  app.get("/api/admin/contacts/export", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const contacts = await ContactSubmission.find().sort({ createdAt: -1 });
      
      const csvHeader = "Name,Email,Subject,Message,Status,Date\n";
      const csvRows = contacts.map(contact => {
        const date = new Date(contact.createdAt).toISOString().split('T')[0];
        const status = contact.isRead ? "Read" : "Unread";
        const escapedMessage = (contact.message || "").replace(/"/g, '""').replace(/\n/g, ' ');
        const escapedSubject = (contact.subject || "").replace(/"/g, '""');
        return `"${contact.name}","${contact.email}","${escapedSubject}","${escapedMessage}","${status}","${date}"`;
      }).join("\n");

      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts-export.csv');
      res.send(csv);
    } catch (error) {
      console.error("Export contacts error:", error);
      res.status(500).json({ message: "Failed to export contacts" });
    }
  });

  // Domain Instructions Routes
  app.get("/api/domain-instructions", async (req, res) => {
    try {
      let instructions = await DomainInstructions.findOne();
      if (!instructions) {
        instructions = await DomainInstructions.create({});
      }
      res.json(instructions);
    } catch (error) {
      console.error("Get domain instructions error:", error);
      res.json({ content: "" });
    }
  });

  app.put("/api/admin/domain-instructions", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = domainInstructionsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data" });
      }
      let instructions = await DomainInstructions.findOne();
      if (instructions) {
        instructions = await DomainInstructions.findByIdAndUpdate(instructions._id, parsed.data, { new: true });
      } else {
        instructions = await DomainInstructions.create(parsed.data);
      }
      await Log.create({ action: "Domain instructions updated", level: "info" });
      res.json(instructions);
    } catch (error) {
      console.error("Update domain instructions error:", error);
      res.status(500).json({ message: "Failed to update instructions" });
    }
  });

  // Storage Settings Routes
  app.get("/api/admin/storage-settings", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      let settings = await StorageSettings.findOne();
      if (!settings) {
        settings = await StorageSettings.create({});
      }
      const emailCount = await Mailbox.countDocuments();
      const messageCount = await Message.countDocuments();
      res.json({ ...settings.toObject(), currentEmailCount: emailCount, currentMessageCount: messageCount });
    } catch (error) {
      console.error("Get storage settings error:", error);
      res.json({ autoDeleteEnabled: true, autoDeleteDays: 7, maxStorageEmails: 10000, maxStorageMessages: 50000 });
    }
  });

  app.put("/api/admin/storage-settings", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = storageSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid settings" });
      }
      let settings = await StorageSettings.findOne();
      if (settings) {
        settings = await StorageSettings.findByIdAndUpdate(settings._id, parsed.data, { new: true });
      } else {
        settings = await StorageSettings.create(parsed.data);
      }
      await Log.create({ action: "Storage settings updated", level: "info" });
      res.json(settings);
    } catch (error) {
      console.error("Update storage settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post("/api/admin/storage/cleanup", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const deletedMessages = await Message.deleteMany({});
      const deletedMailboxes = await Mailbox.deleteMany({});
      await Log.create({ 
        action: "Manual storage cleanup", 
        details: `Deleted ${deletedMailboxes.deletedCount} mailboxes and ${deletedMessages.deletedCount} messages`,
        level: "warning" 
      });
      res.json({ 
        message: "Cleanup completed",
        deletedMailboxes: deletedMailboxes.deletedCount,
        deletedMessages: deletedMessages.deletedCount
      });
    } catch (error) {
      console.error("Storage cleanup error:", error);
      res.status(500).json({ message: "Failed to cleanup storage" });
    }
  });

  // Domain Limits Routes
  app.get("/api/domain-limits", async (req, res) => {
    try {
      let limits = await DomainLimits.findOne();
      if (!limits) {
        limits = await DomainLimits.create({});
      }
      res.json(limits);
    } catch (error) {
      console.error("Get domain limits error:", error);
      res.json({ maxFreeCustomDomains: 1, limitMessage: "Please purchase a plan to add more custom domains." });
    }
  });

  app.get("/api/admin/domain-limits", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      let limits = await DomainLimits.findOne();
      if (!limits) {
        limits = await DomainLimits.create({});
      }
      res.json(limits);
    } catch (error) {
      console.error("Get domain limits error:", error);
      res.json({ maxFreeCustomDomains: 1, limitMessage: "Please purchase a plan to add more custom domains." });
    }
  });

  app.put("/api/admin/domain-limits", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const parsed = domainLimitsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid settings" });
      }
      let limits = await DomainLimits.findOne();
      if (limits) {
        limits = await DomainLimits.findByIdAndUpdate(limits._id, parsed.data, { new: true });
      } else {
        limits = await DomainLimits.create(parsed.data);
      }
      await Log.create({ action: "Domain limits updated", level: "info" });
      res.json(limits);
    } catch (error) {
      console.error("Update domain limits error:", error);
      res.status(500).json({ message: "Failed to update limits" });
    }
  });

  // User CRUD Routes (Admin)
  app.get("/api/admin/users", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const users = await User.find().select("-password").sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.json([]);
    }
  });

  app.put("/api/admin/users/:id", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const { username, email, role, isVerified } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { username, email, role, isVerified },
        { new: true }
      ).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await Log.create({ action: "User updated", details: `User ${user.username} updated`, level: "info" });
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user._id.toString() === req.user!._id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }
      await User.findByIdAndDelete(req.params.id);
      await Log.create({ action: "User deleted", details: `User ${user.username} deleted`, level: "warning" });
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/admin/users/:id/login-as", authMiddleware as any, adminMiddleware as any, async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const token = generateToken(user._id.toString());
      await Log.create({ action: "Admin logged in as user", details: `Logged in as ${user.username}`, level: "warning" });
      res.json({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      });
    } catch (error) {
      console.error("Login as user error:", error);
      res.status(500).json({ message: "Failed to login as user" });
    }
  });

  // Check domain limit for user before adding
  app.get("/api/user/domain-count", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const count = await Domain.countDocuments({ userId: req.user!._id, type: "custom" });
      const limits = await DomainLimits.findOne();
      const maxAllowed = limits?.maxFreeCustomDomains || 1;
      const limitMessage = limits?.limitMessage || "Please purchase a plan to add more custom domains.";
      res.json({ count, maxAllowed, canAddMore: count < maxAllowed, limitMessage });
    } catch (error) {
      console.error("Get domain count error:", error);
      res.json({ count: 0, maxAllowed: 1, canAddMore: true, limitMessage: "" });
    }
  });

  return httpServer;
}
