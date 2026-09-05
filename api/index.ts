import app from "../src/app.js";
import connectDB from "../src/config/db.js";

// Vercel Serverless Execution DB Connection
connectDB();

export default app;