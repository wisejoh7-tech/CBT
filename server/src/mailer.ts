import nodemailer from "nodemailer";
import { config } from "./lib/config"; // named import

export const transporter = nodemailer.createTransport({
  host: config.mail.host || "smtp.gmail.com",
  port: config.mail.port || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
