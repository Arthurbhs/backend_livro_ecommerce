import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "pagbank-orders.log");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function writeLog(entry) {
  fs.appendFileSync(
    LOG_FILE,
    JSON.stringify(entry, null, 2) + "\n\n",
    "utf8"
  );
}

export function auditPagBankRequest(data) {
  writeLog({
    type: "REQUEST",
    timestamp: new Date().toISOString(),
    ...data
  });
}

export function auditPagBankResponse(data) {
  writeLog({
    type: "RESPONSE",
    timestamp: new Date().toISOString(),
    ...data
  });
}

export function auditPagBankError({ requestId, error }) {
  writeLog({
    type: "ERROR",
    timestamp: new Date().toISOString(),
    requestId,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
}
