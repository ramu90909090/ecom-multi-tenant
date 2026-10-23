const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");
const fs = require("fs");

let client = null;
let qrCodeData = "";
let clientStatus = "DISCONNECTED";
let connectedAdminNumber = "";
let readyCallback = null;

const sessionPath = path.join(__dirname, "../.wwebjs_auth");

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
  // ✅ YEH LINE ADD KAREIN (Fixes "Cannot read properties of null (reading 'Socket')"):
  webVersionCache: {
    type: "remote",
    remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js",
  },
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
      console.log("📲 New WhatsApp QR Code generated.");
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
      console.log("✅ WhatsApp Web connected!");
    }
    if (readyCallback) readyCallback();
  });

  client.on("authenticated", () => {
    clientStatus = "AUTHENTICATED";
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

    if (reason !== "LOGOUT") {
      clientStatus = "RECONNECTING";
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

const reconnectExistingSession = async () => {
  clientStatus = "RECONNECTING";
  qrCodeData = "";
  initializeWhatsApp(readyCallback);
  return { success: true, message: "Attempting reconnect with existing session" };
};

const resetAndStartNewSession = async () => {
  clientStatus = "RECONNECTING";
  connectedAdminNumber = "";
  qrCodeData = "";

  if (client) {
    try {
      await client.logout();
    } catch (e) {}
    try {
      await client.destroy();
    } catch (e) {}
    client = null;
  }

  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete session folder:", err);
    }
  }

  setTimeout(() => {
    initializeWhatsApp(readyCallback);
  }, 1500);

  return { success: true, message: "Old session cleared. Fresh QR code will be generated." };
};

const disconnectClient = async () => {
  if (client) {
    try {
      await client.logout();
    } catch (e) {}
    try {
      await client.destroy();
    } catch (e) {}
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