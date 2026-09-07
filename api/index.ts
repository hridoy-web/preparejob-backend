import app from "../src/app.js";
import connectDB from "../src/config/db.js";

// Vercel Serverless Execution DB Connection
export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}