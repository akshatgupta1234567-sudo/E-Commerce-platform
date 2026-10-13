const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email is not configured; set EMAIL_USER and EMAIL_PASS");
  }

  const transportOptions = process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      }
    : {
        service: process.env.EMAIL_SERVICE || "Gmail",
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      };

  const transporter = nodemailer.createTransport(transportOptions);
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || EMAIL_USER,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("EMAIL DELIVERY ERROR:", error);
    throw new Error("Unable to send email; check the email provider settings");
  } finally {
    transporter.close();
  }
};

module.exports = sendEmail;
