import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); 
import express from "express"
import cors from "cors"
import { clerkMiddleware } from '@clerk/express'
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import User from "./models/user.model.js"
import { connectDB } from "./lib/db.js"


const app = express()
const port = process.env.PORT
const frontend_url = process.env.FRONT_URL

// -----        middleware        -----
app.use(express.json())
app.use(cors({origin:frontend_url,credentials:true}))
app.use(clerkMiddleware())


// -----        endpoints         -----
app.get("/health", (req,res)=>{
    res.status(200).json({ok: true})
})

//listening
app.listen(port, () => {
    connectDB()
    console.log(`Listening on port ${port}`)
})