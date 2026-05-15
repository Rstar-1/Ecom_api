import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadEnv = () => {
  const envType = process.env.NODE_ENV || "development";
  const fileName = envType === "development" ? "dev.env" : 
                   envType === "staging" ? "staging.env" : 
                   "prod.env";
  
  const envPath = path.resolve(__dirname, "../../env", fileName);
  
  const result = dotenv.config({ path: envPath, override: true });
  
  if (result.error) {
    console.warn(`⚠️ Could not load env file from ${envPath}:`, result.error.message);
  } else {
    // console.log(`✅ Loaded env from ${envPath}`);
  }
};
