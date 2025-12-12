import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import { ImapSettings, Mailbox, Message } from "../models/index";

let imapClient: Imap | null = null;
let isConnected = false;

export async function initializeImap(): Promise<boolean> {
  try {
    const settings = await ImapSettings.findOne({ isActive: true });
    
    if (!settings) {
      console.log("No active IMAP settings found");
      return false;
    }

    imapClient = new Imap({
      user: settings.user,
      password: settings.password,
      host: settings.host,
      port: settings.port,
      tls: settings.tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    return new Promise((resolve) => {
      if (!imapClient) {
        resolve(false);
        return;
      }

      imapClient.once("ready", () => {
        isConnected = true;
        console.log("IMAP connection established");
        resolve(true);
      });

      imapClient.once("error", (err: Error) => {
        console.error("IMAP connection error:", err);
        isConnected = false;
        resolve(false);
      });

      imapClient.once("end", () => {
        isConnected = false;
        console.log("IMAP connection ended");
      });

      imapClient.connect();
    });
  } catch (error) {
    console.error("IMAP initialization failed:", error);
    return false;
  }
}

export async function fetchNewEmails(): Promise<void> {
  if (!imapClient || !isConnected) {
    const connected = await initializeImap();
    if (!connected) {
      console.log("Could not connect to IMAP");
      return;
    }
  }

  if (!imapClient) return;

  try {
    imapClient.openBox("INBOX", false, async (err, box) => {
      if (err) {
        console.error("Error opening inbox:", err);
        return;
      }

      const searchCriteria = ["UNSEEN"];
      
      imapClient!.search(searchCriteria, async (searchErr, results) => {
        if (searchErr) {
          console.error("Error searching emails:", searchErr);
          return;
        }

        if (!results || results.length === 0) {
          console.log("No new emails found");
          return;
        }

        const fetch = imapClient!.fetch(results, { bodies: "", markSeen: true });

        fetch.on("message", (msg) => {
          msg.on("body", async (stream) => {
            try {
              const parsed = await simpleParser(stream);
              await processEmail(parsed);
            } catch (parseErr) {
              console.error("Error parsing email:", parseErr);
            }
          });
        });

        fetch.once("error", (fetchErr) => {
          console.error("Fetch error:", fetchErr);
        });

        fetch.once("end", () => {
          console.log(`Processed ${results.length} new emails`);
        });
      });
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
  }
}

async function processEmail(parsed: ParsedMail): Promise<void> {
  try {
    const toAddresses = Array.isArray(parsed.to) 
      ? parsed.to.flatMap(t => t.value.map(v => v.address))
      : parsed.to?.value.map(v => v.address) || [];

    for (const toAddress of toAddresses) {
      if (!toAddress) continue;

      const mailbox = await Mailbox.findOne({ email: toAddress.toLowerCase() });
      
      if (!mailbox) {
        continue;
      }

      const fromAddress = parsed.from?.value[0];
      
      const message = new Message({
        mailboxId: mailbox._id,
        mailboxEmail: mailbox.email,
        from: fromAddress?.address || "unknown@unknown.com",
        fromName: fromAddress?.name,
        to: toAddress,
        subject: parsed.subject || "(No Subject)",
        textBody: parsed.text,
        htmlBody: parsed.html || undefined,
        attachments: parsed.attachments?.map(att => ({
          filename: att.filename || "attachment",
          contentType: att.contentType,
          size: att.size,
        })),
        receivedAt: parsed.date || new Date(),
      });

      await message.save();
      console.log(`Saved email to mailbox: ${mailbox.email}`);
    }
  } catch (error) {
    console.error("Error processing email:", error);
  }
}

export async function testImapConnection(): Promise<boolean> {
  try {
    const settings = await ImapSettings.findOne({ isActive: true });
    
    if (!settings) {
      return false;
    }

    const testClient = new Imap({
      user: settings.user,
      password: settings.password,
      host: settings.host,
      port: settings.port,
      tls: settings.tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    return new Promise((resolve) => {
      testClient.once("ready", () => {
        testClient.end();
        resolve(true);
      });

      testClient.once("error", () => {
        resolve(false);
      });

      testClient.connect();
    });
  } catch {
    return false;
  }
}

export function disconnectImap(): void {
  if (imapClient && isConnected) {
    imapClient.end();
    isConnected = false;
  }
}
