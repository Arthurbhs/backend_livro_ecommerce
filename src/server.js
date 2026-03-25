import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import routes from "./routes.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

/**
 * ===============================
 * MIDDLEWARES
 * ===============================
 */
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

/**
 * ===============================
 * REQUEST LOGGER + REQUEST ID
 * ===============================
 */
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();

  console.log("➡️ HTTP REQUEST", {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    body: req.body,
  });

  res.on("finish", () => {
    console.log("⬅️ HTTP RESPONSE", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
    });
  });

  next();
});

/**
 * ===============================
 * ROTAS
 * ===============================
 */
app.use("/api", routes);

/**
 * ===============================
 * ERROR HANDLER (GLOBAL)
 * ===============================
 */
app.use((err, req, res, next) => {
  console.error("💥 UNHANDLED ERROR", {
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: "Erro interno do servidor",
    requestId: req.requestId,
  });
});

/**
 * ===============================
 * START SERVER
 * ===============================
 */
const PORT = process.env.PORT || 3001;

// ⚠️ NÃO logar token inteiro em produção
if (process.env.NODE_ENV !== "production") {
  console.log(
    "🔑 PAGBANK TOKEN (dev):",
    process.env.PAGBANK_TOKEN?.slice(0, 6) + "..."
  );
}

app.listen(PORT, () => {
  console.log("🔥 Backend rodando na porta", PORT);
  console.log("Ambiente:", process.env.NODE_ENV || "development");

});
