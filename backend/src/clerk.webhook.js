import express from "express";
import User from "./models/user.model.js";
import { Webhook } from "svix";

const router = express.Router();

router.post("/", async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add CLERK_WEBHOOK_SIGNING_SECRET from Clerk Dashboard to .env');
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headers = req.headers;
  const payload = req.body;
  let evt;
  try {
    evt = wh.verify(payload, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"],
    });
  } catch (err) {
    console.error("Error verifying webhook:", err.message);
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url, email_addresses, username } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || username || email?.split("@")[0];

    try {
      await User.findOneAndUpdate(
        { clerkId: id },
        { 
          clerkId: id, 
          email, 
          fullName, 
          profilePic: image_url 
        },
        { new: true, upsert: true }
      );
      console.log(`User ${id} synced to MongoDB`);
    } catch (err) {
      console.error("Database update error:", err);
      return res.status(500).json({ message: "Database update failed" });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    await User.findOneAndDelete({ clerkId: id });
    console.log(`User ${id} deleted from MongoDB`);
  }

  res.status(200).json({ success: true, message: "Webhook received" });
});

export default router;