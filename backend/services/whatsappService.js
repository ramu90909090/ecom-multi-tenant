const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");
const fs = require("fs");

let client = null;
let qrCodeData = "";
let clientStatus = "DISCONNECTED"; // DISCONNECTED | RECONNECTING | QR_READY | READY | AUTH_FAILURE
let connectedAdminNumber = "";
let readyCallback = null;

const sessionPath = path.join(__dirname, "../.wwebjs_auth");

// 1. Initialize WhatsApp Client
const initializeWhatsApp = (onReadyCallback) => {
  if (onReadyCallback) readyCallback = onReadyCallback;

  if (client) {
    try {
      client.destroy();
    } catch (e) {
      console.log("Previous client instance destroyed.");
    }
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionPath
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu"
      ]
    }
  });

  client.on("qr", async (qr) => {
    try {
      qrCodeData = await qrcode.toDataURL(qr);
      clientStatus = "QR_READY";
      console.log("📲 New WhatsApp QR Code generated for scanning.");
    } catch (err) {
      console.error("QR Generation error:", err);
    }
  });

  client.on("ready", () => {
    clientStatus = "READY";
    qrCodeData = "";

    if (client.info && client.info.wid && client.info.wid.user) {
      connectedAdminNumber = client.info.wid.user;
      console.log(`✅ WhatsApp Connected! Admin Number: ${connectedAdminNumber}`);
    } else {
      console.log("✅ WhatsApp Web is connected!");
    }

    if (readyCallback) readyCallback();
  });

  client.on("authenticated", () => {
    clientStatus = "AUTHENTICATED";
    console.log("🔒 WhatsApp Authenticated successfully.");
  });

  client.on("auth_failure", (msg) => {
    clientStatus = "AUTH_FAILURE";
    qrCodeData = "";
    connectedAdminNumber = "";
    console.error("❌ WhatsApp Auth failure:", msg);
  });

  client.on("disconnected", (reason) => {
    console.warn("⚠️ WhatsApp Disconnected:", reason);
    clientStatus = "DISCONNECTED";
    qrCodeData = "";
    connectedAdminNumber = "";

    // Automatic reconnect attempt with existing session after 8 seconds
    if (reason !== "LOGOUT") {
      clientStatus = "RECONNECTING";
      console.log("🔄 Auto-reconnecting to existing saved session in 8 seconds...");
      setTimeout(() => {
        initializeWhatsApp(readyCallback);
      }, 8000);
    }
  });

  client.initialize().catch((err) => {
    console.error("WhatsApp Initialization error:", err);
    clientStatus = "DISCONNECTED";
  });
};

// 2. Reconnect using existing session credentials
const reconnectExistingSession = async () => {
  clientStatus = "RECONNECTING";
  qrCodeData = "";
  initializeWhatsApp(readyCallback);
  return { success: true, message: "Attempting reconnect with existing session" };
};

// 3. Reset & Start Brand New Session (Deletes Auth cache folder)
const resetAndStartNewSession = async () => {
  clientStatus = "RECONNECTING";
  connectedAdminNumber = "";
  qrCodeData = "";

  if (client) {
    try {
      await client.logout();
    } catch (e) {
      console.log("Client logout skipped/already offline.");
    }
    try {
      await client.destroy();
    } catch (e) {
      console.log("Client destroy skipped.");
    }
    client = null;
  }

  // Purana session data folder delete karein
  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log("🗑️ Deleted old .wwebjs_auth session folder.");
    } catch (err) {
      console.error("Failed to delete old session folder:", err);
    }
  }

  // Naya client shuru karein (Fresh QR generate hoga)
  setTimeout(() => {
    initializeWhatsApp(readyCallback);
  }, 1500);

  return { success: true, message: "Old session cleared. Fresh QR code will be generated." };
};

// 4. Manual Disconnect / Logout
const disconnectClient = async () => {
  if (client) {
    try {
      await client.logout();
    } catch (e) {
      console.log("Logout warning:", e.message);
    }
    try {
      await client.destroy();
    } catch (e) {
      console.log("Destroy warning:", e.message);
    }
    client = null;
  }
  clientStatus = "DISCONNECTED";
  connectedAdminNumber = "";
  qrCodeData = "";
};

const formatWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) cleaned = `91${cleaned}`;
  else if (cleaned.length === 11 && cleaned.startsWith("0")) cleaned = `91${cleaned.substring(1)}`;
  return `${cleaned}@c.us`;
};

const isUserRegisteredOnWhatsApp = async (formattedNumber) => {
  if (!client || clientStatus !== "READY") return false;
  try {
    return await client.isRegisteredUser(formattedNumber);
  } catch (err) {
    return false;
  }
};

const sendTextMessage = async (formattedNumber, text) => {
  if (!client || clientStatus !== "READY") {
    throw new Error("WhatsApp is not connected.");
  }
  return await client.sendMessage(formattedNumber, text);
};

module.exports = {
  initializeWhatsApp,
  getClientStatus: () => clientStatus,
  getQrCode: () => qrCodeData,
  getConnectedAdminNumber: () => connectedAdminNumber,
  reconnectExistingSession,
  resetAndStartNewSession,
  disconnectClient,
  formatWhatsAppNumber,
  isUserRegisteredOnWhatsApp,
  sendTextMessage
};