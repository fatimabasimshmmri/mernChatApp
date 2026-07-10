import express from "express"
import User from "./models/user.model.js" //importing my user model to use in the endpoints
import { verifyWebhook } from "@clerk/backend/webhooks"
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const router = express.Router()

router.post("/", async (req, res) => {
    try {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
            if (!signingSecret) {
                console.error("CLERK_WEBHOOK_SIGNING_SECRET is not set in the environment variables.")
                return res.status(503).json({ error: "Webhook signing secret not configured." })
                return
            }  
        const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body)
        const request = new Request("http://internal/webhooks/clerk",{
            method: "POST",
            headers: new Headers(req.headers),
            body: payload
        })

        const evt = await verifyWebhook(request, {signingSecret})
        if (evt.type === "user.created" || evt.type === "user.updated") {
            const userData = evt.data
            const email =
                userData.email_addresses?.find((e) => e.id === userData.primary_email_address_id)?.email_address ??
                userData.email_addresses?.[0]?.email_address

            const fullName =
                [userData.first_name, userData.last_name].filter(Boolean).join(" ") || userData.username || email?.split("@")[0] || "Unknown User"

            await User.findOneAndUpdate(
                { clerkId: userData.id },
                { clerkId: userData.id, email, fullName, profilePic: userData.image_url },
                { new: true, upsert: true, setDefaultsOnInsert: true },
            )
        }

        if (evt.type === "user.deleted") {
            if(evt.data.id) await User.findOneAndDelete({ clerkId: evt.data.id })
        }

        res.status(200).json({ received: true })
    }

    catch (error) 
    {
        console.error("Error processing webhook: ", error.message)
        res.status(500).json({ error: "Internal Server Error: Webhook verification failure" })
    }

})

export default router