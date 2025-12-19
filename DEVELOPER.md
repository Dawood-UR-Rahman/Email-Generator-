# TempMail Developer Documentation

Complete guide to understanding and working with the TempMail temporary email service system.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [CRUD Operations](#crud-operations)
3. [IMAP/SMTP Configuration](#imapsmtp-configuration)
4. [Random Email Generation](#random-email-generation)
5. [Authentication Flow](#authentication-flow)
6. [Frontend Content Display](#frontend-content-display)
7. [Database Models](#database-models)
8. [API Endpoints Reference](#api-endpoints-reference)

---

## Architecture Overview

### Tech Stack
- **Backend**: Node.js 20, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React with TypeScript, Wouter routing
- **Email Processing**: IMAP (receive) + SMTP (send) + Nodemailer
- **Cron Jobs**: Automated email fetching and mailbox cleanup
- **Authentication**: JWT tokens with bcryptjs password hashing

### System Flow
```
User Action → Frontend (React)
    ↓
   API Request (JWT authenticated)
    ↓
   Express Routes (server/routes.ts)
    ↓
   Mongoose Models (server/models/index.ts)
    ↓
   MongoDB Database
    ↓
   Response with Data/Token
    ↓
   Frontend State Update & Display
```

### Email Processing Flow
```
IMAP Connection (via Cron every 30 seconds)
    ↓
Fetch unseen emails from email account
    ↓
Parse email data (from, to, subject, body, attachments)
    ↓
Find matching mailbox in database
    ↓
Create Message document in MongoDB
    ↓
Update frontend via API polling
```

---

## CRUD Operations

### 1. Mailbox Management (Create, Read, Update, Delete)

#### CREATE - Generate Random Email
**Frontend Action**: User clicks "Generate Email"

```typescript
// client/src/pages/dashboard.tsx
const generateEmail = async (domainName: string) => {
  // Generate random email prefix
  const randomPrefix = Math.random().toString(36).substring(2, 15);
  const fullEmail = `${randomPrefix}@${domainName}`;
  
  // API call to create mailbox
  const response = await fetch('/api/mailbox/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: fullEmail, 
      domain: domainName 
    }),
  });
  
  const mailbox = await response.json();
  return mailbox;
};
```

**Backend Endpoint**:
```javascript
// server/routes.ts: POST /api/mailbox/create
app.post("/api/mailbox/create", optionalAuthMiddleware, async (req, res) => {
  const { email, domain } = req.body;
  
  // Check if email already exists
  const existingMailbox = await Mailbox.findOne({ email: email.toLowerCase() });
  if (existingMailbox) {
    return res.json(existingMailbox); // Return existing
  }
  
  // Set expiration (5 days by default)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 5);
  
  // Create new mailbox
  const mailbox = await Mailbox.create({
    email: email.toLowerCase(),
    domain,
    userId: req.user?._id,      // null if not logged in
    isPublic: !req.user,         // true if anonymous
    expiresAt,
  });
  
  res.status(201).json(mailbox);
});
```

**Database Operation**:
```typescript
// Mongoose model (server/models/index.ts)
const mailboxSchema = new Schema({
  email: { type: String, unique: true, lowercase: true },
  domain: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

#### READ - Fetch Messages
**Frontend**:
```typescript
// Query messages for a specific email
const response = await fetch(`/api/messages?email=${encodeURIComponent(fullEmail)}`);
const messages = await response.json();
```

**Backend**:
```javascript
// server/routes.ts: GET /api/messages
app.get("/api/messages", async (req, res) => {
  const { email } = req.query;
  
  // Fetch messages sorted by newest first, limit 50
  const messages = await Message.find({ mailboxEmail: email.toLowerCase() })
    .sort({ receivedAt: -1 })
    .limit(50);
  
  res.json(messages);
});
```

**What Gets Fetched**:
- Message ID, Subject, From, To, Date
- HTML and Text body
- Attachments metadata
- Sender details

#### UPDATE - Not Directly Implemented
Messages are read-only for privacy. Mailbox settings can be updated through admin panel.

#### DELETE - Remove Messages/Mailbox
**Delete Single Message**:
```javascript
// server/routes.ts: DELETE /api/messages/:id
app.delete("/api/messages/:id", async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ message: "Message deleted" });
});
```

**Delete Entire Mailbox**:
```javascript
// server/routes.ts: DELETE /api/mailbox/delete
app.delete("/api/mailbox/delete", async (req, res) => {
  const { email } = req.body;
  
  const mailbox = await Mailbox.findOne({ email: email.toLowerCase() });
  if (mailbox) {
    // Delete all associated messages
    await Message.deleteMany({ mailboxId: mailbox._id });
    // Delete mailbox itself
    await Mailbox.findByIdAndDelete(mailbox._id);
  }
  
  res.json({ message: "Mailbox deleted" });
});
```

### 2. User Management (Admin Only)

#### READ - Get All Users
```javascript
// server/routes.ts: GET /api/admin/users
// Requires authMiddleware + adminMiddleware
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find()
    .select("-password")  // Don't return passwords
    .sort({ createdAt: -1 });
  
  res.json(users);
});
```

#### UPDATE - Edit User
```javascript
// server/routes.ts: PUT /api/admin/users/:id
app.put("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { username, email, role } = req.body;
  
  await User.findByIdAndUpdate(req.params.id, { 
    username, 
    email, 
    role // "user" or "admin"
  });
  
  res.json({ message: "User updated" });
});
```

#### DELETE - Remove User
```javascript
// server/routes.ts: DELETE /api/admin/users/:id
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});
```

### 3. Domain Management

#### CREATE - Add Custom Domain
```javascript
// server/routes.ts: POST /api/domain/add
app.post("/api/domain/add", authMiddleware, async (req, res) => {
  const { name } = req.body;
  
  // Check uniqueness
  const existing = await Domain.findOne({ name: name.toLowerCase() });
  if (existing) return res.status(400).json({ message: "Domain exists" });
  
  // Generate DNS verification token
  const verificationTxt = `tempmail-verify=${uuidv4()}`;
  
  const domain = await Domain.create({
    name: name.toLowerCase(),
    type: "custom",
    userId: req.user._id,
    verificationTxt,
    dnsStatus: "pending",
  });
  
  res.status(201).json(domain);
});
```

#### READ - Get Domains
```javascript
// server/routes.ts: GET /api/domains
// Returns system domains + user's verified custom domains
app.get("/api/domains", optionalAuthMiddleware, async (req, res) => {
  const query = { 
    isActive: true,
    $or: [
      { type: "system" },
      { type: "custom", isVerified: true, userId: req.user?._id }
    ]
  };
  
  const domains = await Domain.find(query).sort({ type: 1, name: 1 });
  res.json(domains);
});
```

#### DELETE - Remove Domain
```javascript
// server/routes.ts: DELETE /api/domain/:id
app.delete("/api/domain/:id", authMiddleware, async (req, res) => {
  const domain = await Domain.findById(req.params.id);
  
  // Verify ownership or admin status
  if (domain.userId.toString() !== req.user._id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized" });
  }
  
  await Domain.findByIdAndDelete(req.params.id);
  res.json({ message: "Domain deleted" });
});
```

---

## IMAP/SMTP Configuration

### SMTP Configuration (Sending Emails)

#### Setup Process
1. **Admin Panel**: Go to Settings → SMTP Configuration
2. **Input Required**:
   - SMTP Host (e.g., smtp.gmail.com)
   - Port (usually 587 or 465)
   - Username (email address)
   - Password (app password, not regular password)
   - Secure (TLS/SSL option)

#### Backend SMTP Initialization
```javascript
// server/services/email.ts
import nodemailer from "nodemailer";

let transporter = null;

export async function initializeSmtp() {
  const settings = await SmtpSettings.findOne({ isActive: true });
  
  if (!settings) {
    console.log("No SMTP settings configured");
    return false;
  }
  
  // Create transporter with settings
  transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,  // true for 465, false for 587
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  });
  
  // Verify connection
  try {
    await transporter.verify();
    console.log("SMTP connection verified");
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error);
    return false;
  }
}
```

#### Test SMTP Connection
```javascript
// server/services/email.ts
export async function testSmtpConnection(settings) {
  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  });
  
  await transporter.verify();
  return true; // If successful
}
```

#### Send Email Example
```javascript
// server/services/email.ts
export async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: "Verify Your Email - TempMail",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h1>Welcome to TempMail!</h1>
        <p>Click the link to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
      </div>
    `,
  });
}

export async function sendEmail(options) {
  if (!transporter) {
    await initializeSmtp();
  }
  
  const settings = await SmtpSettings.findOne({ isActive: true });
  
  try {
    await transporter.sendMail({
      from: settings.user,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
```

### IMAP Configuration (Receiving Emails)

#### Setup Process
1. **Admin Panel**: Go to Settings → IMAP Configuration
2. **Input Required**:
   - IMAP Host (e.g., imap.gmail.com)
   - Port (usually 993)
   - Username (email account)
   - Password (app password)
   - TLS Option

#### Backend IMAP Initialization
```javascript
// server/services/imap.ts
import Imap from "imap";
import { simpleParser } from "mailparser";

let imapClient = null;
let isConnected = false;

export async function initializeImap() {
  const settings = await ImapSettings.findOne({ isActive: true });
  
  if (!settings) {
    console.log("No IMAP settings found");
    return false;
  }
  
  // Create IMAP client
  imapClient = new Imap({
    user: settings.user,
    password: settings.password,
    host: settings.host,
    port: settings.port,
    tls: settings.tls,
    tlsOptions: { rejectUnauthorized: false },
  });
  
  return new Promise((resolve) => {
    imapClient.once("ready", () => {
      isConnected = true;
      console.log("IMAP connection established");
      resolve(true);
    });
    
    imapClient.once("error", (err) => {
      console.error("IMAP error:", err);
      isConnected = false;
      resolve(false);
    });
    
    imapClient.connect();
  });
}
```

#### Test IMAP Connection
```javascript
// server/services/imap.ts
export async function testImapConnection(settings) {
  return new Promise((resolve) => {
    const testClient = new Imap({
      user: settings.user,
      password: settings.password,
      host: settings.host,
      port: settings.port,
      tls: settings.tls,
    });
    
    testClient.once("ready", () => {
      testClient.end();
      resolve(true);
    });
    
    testClient.once("error", (err) => {
      console.error("IMAP test failed:", err);
      resolve(false);
    });
    
    testClient.connect();
  });
}
```

#### Email Fetching (Automatic)
```javascript
// server/services/imap.ts
export async function fetchNewEmails() {
  if (!imapClient || !isConnected) {
    const connected = await initializeImap();
    if (!connected) return;
  }
  
  imapClient.openBox("INBOX", false, async (err, box) => {
    if (err) {
      console.error("Error opening inbox:", err);
      return;
    }
    
    // Search for unseen emails
    imapClient.search(["UNSEEN"], async (err, results) => {
      if (err || !results.length) return;
      
      const f = imapClient.fetch(results, { bodies: "" });
      
      f.on("message", (msg) => {
        simpleParser(msg, async (err, parsed) => {
          if (err) return;
          
          // Save parsed email to database
          const mailboxEmail = parsed.to.text; // e.g., random123@tempmail.io
          const subject = parsed.subject || "(No Subject)";
          const from = parsed.from.text;
          const html = parsed.html || "";
          const text = parsed.text || "";
          
          // Find matching mailbox
          const mailbox = await Mailbox.findOne({ 
            email: mailboxEmail.toLowerCase() 
          });
          
          if (mailbox) {
            // Store message
            await Message.create({
              mailboxId: mailbox._id,
              mailboxEmail: mailboxEmail.toLowerCase(),
              from,
              subject,
              html,
              text,
              receivedAt: new Date(),
            });
          }
        });
      });
    });
  });
}
```

#### Cron Job Configuration
```javascript
// server/services/cron.ts
export function startCronJobs() {
  // Fetch emails every 30 seconds
  cron.schedule("*/30 * * * * *", async () => {
    try {
      await fetchNewEmails();
    } catch (error) {
      console.error("Cron: Email fetch error:", error);
    }
  });
  
  // Clean expired mailboxes every hour
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    const expiredMailboxes = await Mailbox.find({ expiresAt: { $lt: now } });
    
    for (const mailbox of expiredMailboxes) {
      await Message.deleteMany({ mailboxId: mailbox._id });
      await Mailbox.findByIdAndDelete(mailbox._id);
    }
    
    console.log(`Cleaned up ${expiredMailboxes.length} expired mailboxes`);
  });
  
  // Delete old messages daily (5 days old)
  cron.schedule("0 0 * * *", async () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const result = await Message.deleteMany({ createdAt: { $lt: fiveDaysAgo } });
    console.log(`Deleted ${result.deletedCount} old messages`);
  });
}
```

---

## Random Email Generation

### Frontend Email Generation
```typescript
// client/src/pages/dashboard.tsx
import { useState } from "react";

export function MailboxGenerator() {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  
  // Generate random email prefix
  const generateRandomPrefix = () => {
    // Use combination of letters, numbers
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  // Create mailbox with random email
  const handleGenerateEmail = async () => {
    const prefix = generateRandomPrefix();
    const fullEmail = `${prefix}@${selectedDomain}`;
    
    try {
      const response = await fetch("/api/mailbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: fullEmail, 
          domain: selectedDomain 
        }),
      });
      
      const mailbox = await response.json();
      setGeneratedEmail(mailbox.email);
      
      // Copy to clipboard
      navigator.clipboard.writeText(mailbox.email);
      
    } catch (error) {
      console.error("Failed to generate email:", error);
    }
  };
  
  return (
    <div>
      <select 
        value={selectedDomain} 
        onChange={(e) => setSelectedDomain(e.target.value)}
      >
        {domains.map(d => (
          <option key={d._id} value={d.name}>{d.name}</option>
        ))}
      </select>
      
      <button onClick={handleGenerateEmail}>
        Generate Email
      </button>
      
      {generatedEmail && (
        <div>
          <p>Your email: {generatedEmail}</p>
          <p>Expires in: 5 days</p>
        </div>
      )}
    </div>
  );
}
```

### Backend Random Validation
```javascript
// Ensures emails are unique before creation
const existingMailbox = await Mailbox.findOne({ 
  email: email.toLowerCase() 
});

if (existingMailbox) {
  // Email already taken, regenerate on frontend
  return res.json(existingMailbox); // Or error
}
```

### Email Checking (Live Updates)
```typescript
// Frontend polling
useEffect(() => {
  const interval = setInterval(async () => {
    if (currentEmail) {
      const response = await fetch(`/api/messages?email=${currentEmail}`);
      const messages = await response.json();
      setMessages(messages);
    }
  }, 5000); // Poll every 5 seconds
  
  return () => clearInterval(interval);
}, [currentEmail]);
```

---

## Authentication Flow

### Registration Flow

**Frontend (register.tsx)**:
```typescript
// 1. User fills form with username, email, password
// 2. Frontend validates with Zod schema
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword);

// 3. Submit to backend
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, email, password }),
});

// 4. Get JWT token and user data
const { token, user } = await response.json();

// 5. Store token in localStorage
localStorage.setItem("authToken", token);

// 6. Set auth context and redirect
setUser(user);
navigate("/dashboard");
```

**Backend (routes.ts - POST /api/auth/register)**:
```javascript
// 1. Validate input with Zod
const parsed = insertUserSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ errors: parsed.error.flatten() });
}

// 2. Check if user already exists
const existingUser = await User.findOne({ 
  $or: [{ email }, { username }] 
});
if (existingUser) {
  return res.status(400).json({ message: "User already exists" });
}

// 3. Hash password with bcryptjs
const hashedPassword = await bcrypt.hash(password, 10);

// 4. Create user in database
const user = await User.create({
  username,
  email,
  password: hashedPassword,
  verificationToken: uuidv4(),
  isVerified: true,
});

// 5. Generate JWT token
const token = generateToken(user._id.toString());

// 6. Log user action
await Log.create({
  action: "User registered",
  userId: user._id,
  details: `User ${username} registered`,
});

// 7. Send welcome email (async, non-blocking)
sendWelcomeEmail(email, username);

// 8. Return token and user data
res.status(201).json({
  user: {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  },
  token,
});
```

### Login Flow

**Frontend (login.tsx)**:
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const { token, user } = await response.json();

// Store token
localStorage.setItem("authToken", token);

// Update auth state
setUser(user);
navigate("/dashboard");
```

**Backend (routes.ts - POST /api/auth/login)**:
```javascript
// 1. Validate input
const parsed = loginSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ message: "Invalid input" });
}

// 2. Find user by email
const user = await User.findOne({ email });
if (!user) {
  return res.status(401).json({ message: "Invalid credentials" });
}

// 3. Compare password with hash
const isValidPassword = await bcrypt.compare(password, user.password);
if (!isValidPassword) {
  return res.status(401).json({ message: "Invalid credentials" });
}

// 4. Generate JWT token
const token = generateToken(user._id.toString());

// 5. Log login action
await Log.create({
  action: "User login",
  userId: user._id,
  details: `User ${user.username} logged in`,
});

// 6. Return token and user
res.json({
  user: {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  },
  token,
});
```

### JWT Token Verification

**Middleware (server/middleware/auth.ts)**:
```javascript
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Attach to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
```

### Auth Context (Frontend)

**client/src/lib/auth-context.tsx**:
```typescript
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      setToken(savedToken);
      // Optionally verify token is valid
    }
  }, []);
  
  const register = async (username, email, password) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    
    if (!response.ok) throw new Error("Registration failed");
    
    const { token: newToken, user: newUser } = await response.json();
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("authToken", newToken);
  };
  
  const login = async (email, password) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) throw new Error("Login failed");
    
    const { token: newToken, user: newUser } = await response.json();
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("authToken", newToken);
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
  };
  
  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Frontend Content Display

### Dashboard Display (Authenticated Users)
```typescript
// client/src/pages/dashboard.tsx
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [domains, setDomains] = useState([]);
  const [mailboxes, setMailboxes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  
  // 1. Load domains
  useEffect(() => {
    const loadDomains = async () => {
      const response = await fetch("/api/domains", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDomains(data);
    };
    
    if (token) loadDomains();
  }, [token]);
  
  // 2. Load user's mailboxes
  useEffect(() => {
    const loadMailboxes = async () => {
      const response = await fetch("/api/mailboxes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMailboxes(data);
    };
    
    if (token) loadMailboxes();
  }, [token]);
  
  // 3. Load messages when mailbox selected
  useEffect(() => {
    if (!selectedMailbox) return;
    
    const loadMessages = async () => {
      const response = await fetch(
        `/api/messages?email=${encodeURIComponent(selectedMailbox.email)}`
      );
      const data = await response.json();
      setMessages(data);
    };
    
    loadMessages();
    
    // Poll every 5 seconds for new emails
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedMailbox]);
  
  return (
    <div className="dashboard">
      <header>
        <h1>Welcome, {user?.username}!</h1>
        <p>Email: {user?.email}</p>
      </header>
      
      {/* Domain Selection */}
      <section>
        <h2>Generate New Email</h2>
        <select onChange={(e) => setSelectedDomain(e.target.value)}>
          <option>Select Domain</option>
          {domains.map(d => (
            <option key={d._id} value={d.name}>{d.name}</option>
          ))}
        </select>
        <button onClick={generateEmail}>Generate</button>
      </section>
      
      {/* Mailbox List */}
      <section>
        <h2>Your Mailboxes</h2>
        <ul>
          {mailboxes.map(m => (
            <li 
              key={m._id} 
              onClick={() => setSelectedMailbox(m)}
              className={selectedMailbox?._id === m._id ? "active" : ""}
            >
              <span>{m.email}</span>
              <small>Expires: {new Date(m.expiresAt).toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Messages Display */}
      {selectedMailbox && (
        <section>
          <h2>Messages for {selectedMailbox.email}</h2>
          {messages.length === 0 ? (
            <p>No messages yet</p>
          ) : (
            <ul>
              {messages.map(msg => (
                <li key={msg._id}>
                  <div className="from">{msg.from}</div>
                  <div className="subject">{msg.subject}</div>
                  <div className="preview">{msg.text.substring(0, 100)}...</div>
                  <div className="date">
                    {new Date(msg.receivedAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
```

### Admin Panel Display
```typescript
// client/src/pages/admin.tsx
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export default function AdminPanel() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  
  // Check admin role
  if (user?.role !== "admin") {
    return <div>Access denied. Admin only.</div>;
  }
  
  // Load admin data
  useEffect(() => {
    const loadData = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Get users
      const usersRes = await fetch("/api/admin/users", { headers });
      const usersData = await usersRes.json();
      setUsers(usersData);
      
      // Get contact submissions
      const contactsRes = await fetch("/api/admin/contacts", { headers });
      const contactsData = await contactsRes.json();
      setContacts(contactsData);
      
      // Get blog posts
      const postsRes = await fetch("/api/admin/blog", { headers });
      const postsData = await postsRes.json();
      setBlogPosts(postsData);
    };
    
    loadData();
  }, [token]);
  
  // User management handlers
  const handleEditUser = async (userId, data) => {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      // Reload users
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(await res.json());
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!confirm("Delete user?")) return;
    
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.ok) {
      setUsers(users.filter(u => u._id !== userId));
    }
  };
  
  return (
    <div className="admin-panel">
      <h1>Admin Dashboard</h1>
      
      {/* Users Tab */}
      <section>
        <h2>Users ({users.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isVerified ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => handleEditUser(u._id, {...u})}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteUser(u._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      {/* Contacts Tab */}
      <section>
        <h2>Contact Submissions ({contacts.length})</h2>
        <ul>
          {contacts.map(c => (
            <li key={c._id}>
              <p><strong>{c.name}</strong> - {c.email}</p>
              <p>{c.message}</p>
              <small>{new Date(c.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

### Public Pages Content Display
```typescript
// client/src/pages/index.tsx - Homepage
import { useEffect, useState } from "react";

export default function Home() {
  const [siteSettings, setSiteSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  
  useEffect(() => {
    const loadContent = async () => {
      // Get site settings
      const settingsRes = await fetch("/api/site-settings");
      setSiteSettings(await settingsRes.json());
      
      // Get statistics
      const statsRes = await fetch("/api/stats");
      setStats(await statsRes.json());
      
      // Get latest blog posts
      const blogRes = await fetch("/api/blog?limit=3");
      setBlogPosts(await blogRes.json());
    };
    
    loadContent();
  }, []);
  
  return (
    <div>
      {/* Header with site settings */}
      <header>
        {siteSettings?.headerLogo && (
          <img src={siteSettings.headerLogo} alt="Logo" />
        )}
        <h1>{siteSettings?.siteName || "TempMail"}</h1>
      </header>
      
      {/* Display statistics */}
      <section className="stats">
        <div>
          <h3>{stats?.emailsCreated}</h3>
          <p>Emails Created</p>
        </div>
        <div>
          <h3>{stats?.messagesReceived}</h3>
          <p>Messages Received</p>
        </div>
        <div>
          <h3>{stats?.activeUsers}</h3>
          <p>Active Users</p>
        </div>
      </section>
      
      {/* Display blog posts */}
      <section className="blog">
        <h2>Latest Articles</h2>
        {blogPosts.map(post => (
          <article key={post._id}>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <a href={`/blog/${post.slug}`}>Read More</a>
          </article>
        ))}
      </section>
      
      {/* Footer with site info */}
      <footer>
        <p>{siteSettings?.copyrightText}</p>
        <p>{siteSettings?.footerText}</p>
      </footer>
    </div>
  );
}
```

---

## Database Models

### Core Models

**User Model**:
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String ("user" | "admin"),
  isVerified: Boolean,
  verificationToken: String,
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

**Mailbox Model**:
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  domain: String,
  userId: ObjectId (ref: User, optional),
  isPublic: Boolean,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

**Message Model**:
```javascript
{
  _id: ObjectId,
  mailboxId: ObjectId (ref: Mailbox),
  mailboxEmail: String,
  from: String,
  subject: String,
  html: String,
  text: String,
  receivedAt: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

**Domain Model**:
```javascript
{
  _id: ObjectId,
  name: String (unique),
  type: String ("system" | "custom"),
  userId: ObjectId (ref: User, optional),
  isActive: Boolean,
  isVerified: Boolean,
  dnsStatus: String ("pending" | "verified"),
  verificationTxt: String,
  retentionDays: Number,
  createdAt: Date,
  updatedAt: Date,
}
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset

### Mailbox Operations
- `POST /api/mailbox/create` - Create temporary email
- `GET /api/messages?email=...` - Get messages for email
- `DELETE /api/messages/:id` - Delete specific message
- `DELETE /api/mailbox/delete` - Delete mailbox and messages

### Domain Management
- `GET /api/domains` - Get available domains
- `POST /api/domain/add` - Add custom domain
- `GET /api/domain/status/:id` - Check domain verification
- `DELETE /api/domain/:id` - Delete domain

### Admin Operations
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Edit user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/login-as` - Admin login as user
- `GET /api/admin/contacts` - Get contact submissions
- `GET /api/admin/blog` - Get blog posts

### Public Data
- `GET /api/stats` - Get system statistics
- `GET /api/blog` - Get published blog posts
- `GET /api/site-settings` - Get site configuration
- `GET /api/ads` - Get active ads

---

## Error Handling

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad request (validation error)
- **401**: Unauthorized (no token/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Server error

### Standard Error Response
```json
{
  "message": "Error description",
  "errors": {
    "fieldName": ["error message"]
  }
}
```

---

## Testing SMTP/IMAP

### Test Endpoint Flow
1. Admin inputs SMTP/IMAP settings
2. Click "Test Connection"
3. Backend attempts connection verification
4. Returns success/failure message

### Common Issues
- **Port Error**: Wrong port (587 vs 465)
- **Auth Error**: Wrong username/password or app password not generated
- **TLS Error**: TLS setting mismatch
- **Host Error**: Wrong SMTP/IMAP host address

---

This documentation covers the complete system architecture and implementation details for the TempMail service.
