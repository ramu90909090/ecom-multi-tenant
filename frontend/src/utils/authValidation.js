export const sanitizeInput = (text) => text?.replace(/[<>/{}$]/g, "").trim() || "";

export const sanitizeMobile = (phone) => phone?.replace(/\D/g, "").slice(0, 10) || "";

export const validateAuth = {
  email: (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email?.trim().toLowerCase()),
  mobile: (phone) => /^[6-9]\d{9}$/.test(phone?.trim()),
  pincode: (pin) => /^[1-9][0-9]{5}$/.test(pin?.trim()),
  password: (pass) => pass && pass.length >= 6,
  otp: (otp) => /^\d{6}$/.test(otp?.trim())
};