import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localFallbackUploadsDir = path.join(__dirname, "../../public/uploads");
const configuredUploadsDir =
  process.env.UPLOAD_DIR ||
  (fs.existsSync("/data") ? "/data/uploads" : localFallbackUploadsDir);

const ensureWritableDirectory = (directoryPath) => {
  try {
    fs.mkdirSync(directoryPath, { recursive: true });
    fs.accessSync(directoryPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

let resolvedUploadsDir = configuredUploadsDir;

if (!ensureWritableDirectory(resolvedUploadsDir)) {
  resolvedUploadsDir = localFallbackUploadsDir;
}

if (!ensureWritableDirectory(resolvedUploadsDir)) {
  throw new Error(
    `Unable to initialize uploads directory. Checked: ${configuredUploadsDir} and ${localFallbackUploadsDir}`,
  );
}

if (resolvedUploadsDir !== configuredUploadsDir) {
  console.warn(
    `[Uploads] Unable to use "${configuredUploadsDir}". Falling back to "${resolvedUploadsDir}".`,
  );
}

export const uploadsDir = resolvedUploadsDir;
export const uploadsPublicPath = "/uploads";

export const resolveUploadedFilePath = (filename) => `${uploadsPublicPath}/${filename}`;
