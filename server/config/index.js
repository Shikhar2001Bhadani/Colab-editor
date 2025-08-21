import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT,
  mongoURI: process.env.MONGO_URI,
  clientURL: process.env.CLIENT_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV,
  geminiApiKey: process.env.GEMINI_API_KEY,
};