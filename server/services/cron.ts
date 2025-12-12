import cron from "node-cron";
import { Mailbox, Message } from "../models/index";
import { fetchNewEmails } from "./imap";

export function startCronJobs(): void {
  cron.schedule("*/30 * * * * *", async () => {
    try {
      await fetchNewEmails();
    } catch (error) {
      console.error("Cron: Error fetching emails:", error);
    }
  });

  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      
      const expiredMailboxes = await Mailbox.find({ expiresAt: { $lt: now } });
      
      for (const mailbox of expiredMailboxes) {
        await Message.deleteMany({ mailboxId: mailbox._id });
        await Mailbox.findByIdAndDelete(mailbox._id);
      }

      console.log(`Cron: Cleaned up ${expiredMailboxes.length} expired mailboxes`);
    } catch (error) {
      console.error("Cron: Error cleaning up expired mailboxes:", error);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const result = await Message.deleteMany({ createdAt: { $lt: fiveDaysAgo } });
      console.log(`Cron: Deleted ${result.deletedCount} old messages`);
    } catch (error) {
      console.error("Cron: Error deleting old messages:", error);
    }
  });

  console.log("Cron jobs started");
}
