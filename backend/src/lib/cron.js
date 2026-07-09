import { CronJob } from "cron";
import http from "node:http";
import https from "node:https";
import path from 'path';  //path resolve
import { fileURLToPath } from 'url';  //path resolve
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);  //path resolve
const __dirname = path.dirname(__filename);  //path resolve
dotenv.config({ path: path.resolve(__dirname, '../../.env') });  //path resolve

// every 14 minutes send a GET request to the health endpoint
const job = new CronJob("*/14 * * * *", function () {
  const base = process.env.FRONTEND_URL;
  if (!base) return;
  const url = new URL("/api/health", base).href;
  const client = url.startsWith("https:") ? https : http;

  client
    .get(url, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

export default job;