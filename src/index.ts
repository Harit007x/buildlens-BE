import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenvFlow from "dotenv-flow";
import { router } from "./routes/routes";
import { createServer } from "http";
import { prisma } from "./utils/db";
import { errorHandler } from "./middlewares/errorHandler";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./utils/swagger";

dotenvFlow.config();

const app = express();

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://buildlens-fe.vercel.app/",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api", router);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler as unknown as express.ErrorRequestHandler);

const server = createServer(app);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to the database");

    server.listen(PORT, () => {
      console.log(`✅ HTTP server running on http://localhost:${PORT}`);
    });

    const shutdown = async () => {
      console.log("🛑 Shutting down server...");
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}
startServer();
