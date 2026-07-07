import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); 

import mongoose, { mongo } from "mongoose"

import path from 'path';  //path resolve
import { fileURLToPath } from 'url';  //path resolve
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);  //path resolve
const __dirname = path.dirname(__filename);  //path resolve
dotenv.config({ path: path.resolve(__dirname, '../../.env') });  //path resolve

 export async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI
        if (!mongoUri) {
            console.log(mongoUri)
            throw new Error("MONGO_URI required.")
        }
        const conn = await mongoose.connect(mongoUri)
        console.log("MongoDB connected    ---     ", conn.connection.host)
    }
    catch (error){
        console.error("MongoDB connection error: ", error.message)
        process.exit(1)//failed
    }
 }