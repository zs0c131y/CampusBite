const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "MONGODB_URI",
  "FRONTEND_URL",
];

const MAILGUN_ENV_VARS = ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"];

const getMissingEnvVars = (keys) =>
  keys.filter(
    (key) => !process.env[key] || String(process.env[key]).trim() === "",
  );

export const runStartupPreflight = () => {
  const missingRequired = getMissingEnvVars(REQUIRED_ENV_VARS);
  if (missingRequired.length > 0) {
    throw new Error(
      `[Startup] Missing required environment variables: ${missingRequired.join(", ")}`,
    );
  }

  const jwtSecret = process.env.JWT_SECRET || "";
  if (jwtSecret.length < 32) {
    throw new Error(
      "[Startup] JWT_SECRET must be at least 32 characters long.",
    );
  }

  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "";
  if (jwtRefreshSecret.length < 32) {
    throw new Error(
      "[Startup] JWT_REFRESH_SECRET must be at least 32 characters long.",
    );
  }

  const dbType = (process.env.DB_TYPE || "mongodb").toLowerCase();
  if (dbType !== "mongodb") {
    console.warn(
      `[Startup] DB_TYPE is set to "${dbType}". This backend is configured for MongoDB.`,
    );
  }

  const missingMailgun = getMissingEnvVars(MAILGUN_ENV_VARS);
  if (missingMailgun.length > 0) {
    console.warn(
      `[Startup] Mailgun is not fully configured. Missing: ${missingMailgun.join(
        ", ",
      )}. Email features will be skipped.`,
    );
  }
};
