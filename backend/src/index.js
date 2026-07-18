import clerkWebhook from "./clerk.webhook.js"

import dns from 'node:dns'; // google public DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']); 

import express from "express"
import cors from "cors"
import User from "./models/user.model.js" //importing my user model to use in the endpoints
import fs from "fs"
import path from "path"

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from "./lib/db.js"

const app = express()
const apiRouter = express.Router();
const port = process.env.PORT
const frontend_url = process.env.FRONT_URL
const publicDir = path.join(process.cwd(), 'public') //path to the public directory


import job from "./lib/cron.js"

// -----        webhooks          -----
app.use("/api/webhooks/clerk", (req,res,next) =>
    {
        console.log("Webhook route hit. Method:", req.method, "Path:", req.path);
        next();
    },  express.raw({type:"application/json"}),clerkWebhook)

/*
app.post("/api/webhooks/clerk", (req, res, next) => {
    console.log("Webhook route hit. Method:", req.method, "Path:", req.path);
    next();
  },
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signingSecret = process.env.CLERK_WEBHOOK_SIGNINGSECRET;
      if (!signingSecret) {
        res.status(503).json({ message: "Webhook secret is not provided" });
        return;
      }

      // clerk's verifier expects a Web Request with the raw body; express.raw gives a Buffer.
      const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
      const request = new Request("http://internal/webhooks/clerk", {
        method: "POST",
        headers: new Headers(req.headers),
        body: payload,
      });

      // throws if the signature is wrong or the body was tampered with; only then do we trust evt.
      const evt = await verifyWebhook(request, { signingSecret });

      if (evt.type === "user.created" || evt.type === "user.updated") {
        const u = evt.data;

        const email =
          u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
          u.email_addresses?.[0]?.email_address;

        const fullName =
          [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || email?.split("@")[0];

        await User.findOneAndUpdate(
          { clerkId: u.id },
          { clerkId: u.id, email, fullName, profilePic: u.image_url },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );
      }

      if (evt.type === "user.deleted") {
        if (evt.data.id) await User.findOneAndDelete({ clerkId: evt.data.id });
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error in Clerk webhook:", error);
      res.status(400).json({ message: "Webhook verification failed" });
    }
  }
)
  */
//      do not parse webhook events as json, clerk requires raw body to verify the signature

// -----        middleware        -----
app.use(express.json())
app.use(cors({origin:frontend_url,credentials:true}))
app.use(clerkMiddleware())


// -----        endpoints         -----

app.get("/api/health", async (req,res)=>{
    try {
        res.status(200).json({ok: true})
    }
    catch (error) {
        console.error("Health check error: ", error.message)
        res.status(500).json({ok: false, error: error.message})
}})  


if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("*", (req, res, next) => {
        res.sendFile(path.join(publicDir, 'index.html'), (err) => {
            if (err) next(err);
        });
    });
}


//listening
app.listen(port, () => {
    connectDB()
    console.log(`Listening on port ${port}`)

    if(process.env.NODE_ENV === "production")job.start()
})