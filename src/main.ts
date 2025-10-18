import dotenv from "dotenv";
import { client } from "./client";

dotenv.config();
const token = process.env.DISCORD_TOKEN;

await client.login(token);
