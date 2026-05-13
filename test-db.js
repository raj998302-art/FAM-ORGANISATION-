import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.example') });

console.log("MONGODB_URI: ", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.abcde.mongodb.net/fire_arena?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting:', err.message);
    process.exit(1);
  });
