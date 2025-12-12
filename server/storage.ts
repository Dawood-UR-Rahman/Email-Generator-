import { User as UserModel, Domain, Mailbox, Message, ImapSettings, SmtpSettings, Notification, Log } from "./models/index";
import { isDBConnected } from "./db";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  createUser(user: any): Promise<any>;
  getDomains(): Promise<any[]>;
  createMailbox(email: string, domain: string, userId?: string): Promise<any>;
  getMessages(email: string): Promise<any[]>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<any> {
    if (!isDBConnected()) return undefined;
    return UserModel.findById(id).select("-password");
  }

  async getUserByUsername(username: string): Promise<any> {
    if (!isDBConnected()) return undefined;
    return UserModel.findOne({ username }).select("-password");
  }

  async getUserByEmail(email: string): Promise<any> {
    if (!isDBConnected()) return undefined;
    return UserModel.findOne({ email }).select("-password");
  }

  async createUser(userData: { username: string; email: string; password: string }): Promise<any> {
    if (!isDBConnected()) {
      return {
        _id: randomUUID(),
        ...userData,
        role: "user",
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    const user = await UserModel.create(userData);
    return user;
  }

  async getDomains(): Promise<any[]> {
    if (!isDBConnected()) {
      return [
        { _id: "1", name: "tempmail.io", type: "system", isVerified: true, isActive: true },
        { _id: "2", name: "quickmail.dev", type: "system", isVerified: true, isActive: true },
        { _id: "3", name: "disposable.cc", type: "system", isVerified: true, isActive: true },
      ];
    }
    return Domain.find({ isActive: true });
  }

  async createMailbox(email: string, domain: string, userId?: string): Promise<any> {
    if (!isDBConnected()) {
      return {
        _id: randomUUID(),
        email,
        domain,
        userId,
        isPublic: !userId,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);

    return Mailbox.create({
      email,
      domain,
      userId,
      isPublic: !userId,
      expiresAt,
    });
  }

  async getMessages(email: string): Promise<any[]> {
    if (!isDBConnected()) {
      return [];
    }
    return Message.find({ mailboxEmail: email }).sort({ receivedAt: -1 });
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, any>;
  private domains: any[];
  private mailboxes: Map<string, any>;
  private messages: Map<string, any[]>;

  constructor() {
    this.users = new Map();
    this.domains = [
      { _id: "1", name: "tempmail.io", type: "system", isVerified: true, isActive: true },
      { _id: "2", name: "quickmail.dev", type: "system", isVerified: true, isActive: true },
      { _id: "3", name: "disposable.cc", type: "system", isVerified: true, isActive: true },
    ];
    this.mailboxes = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<any> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async getUserByEmail(email: string): Promise<any> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(userData: { username: string; email: string; password: string }): Promise<any> {
    const id = randomUUID();
    const user = { 
      _id: id, 
      ...userData, 
      role: "user",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getDomains(): Promise<any[]> {
    return this.domains;
  }

  async createMailbox(email: string, domain: string, userId?: string): Promise<any> {
    const mailbox = {
      _id: randomUUID(),
      email,
      domain,
      userId,
      isPublic: !userId,
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    this.mailboxes.set(email, mailbox);
    this.messages.set(email, []);
    return mailbox;
  }

  async getMessages(email: string): Promise<any[]> {
    return this.messages.get(email) || [];
  }
}

export const storage = isDBConnected() ? new MongoStorage() : new MemStorage();
