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

// -----        middleware        -----
app.use(express.json())
app.use(cors({origin:frontend_url,credentials:true}))
app.use(clerkMiddleware())


// -----        endpoints         -----

if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir))

    apiRouter.get("/{*any}", (req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'), (err) => next(err))
    })
}

apiRouter.get("/api/health", (req,res)=>{
    res.status(200).json({ok: true})
})

app.use('/api', apiRouter);
//listening
app.listen(port, () => {
    connectDB()
    console.log(`Listening on port ${port}`)
})