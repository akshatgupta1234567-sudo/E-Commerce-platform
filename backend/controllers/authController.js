const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const sendEmail = require("../utils/sendEmail");

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const normalizeEmail = (email) => email.trim().toLowerCase();

const hashOtp = (email, otp) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${email}:${otp}`)
    .digest("hex");

const createOtp = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

const sendVerificationCode = async (user) => {
  const now = new Date();
  const otp = createOtp();
  user.verificationOtpHash = hashOtp(user.email, otp);
  user.verificationOtpExpiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
  user.verificationOtpSentAt = now;
  user.verificationOtpAttempts = 0;
  await user.save();

  try {
    await sendEmail(
      user.email,
      "Verify your Iron & Steel account",
      `Your verification code is ${otp}. It expires in 10 minutes. If you did not create this account, you can ignore this email.`,
    );
  } catch (error) {
    user.verificationOtpHash = null;
    user.verificationOtpExpiresAt = null;
    user.verificationOtpSentAt = null;
    user.verificationOtpAttempts = 0;
    await user.save();
    throw error;
  }
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  token: generateToken(user._id),
  role: user.role,
});

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      message: "Enter a valid name, email, and password of at least 8 characters",
    });
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
    });

    try {
      await sendVerificationCode(user);
    } catch (error) {
      await User.deleteOne({ _id: user._id, verified: false });
      console.error("REGISTRATION VERIFICATION EMAIL ERROR:", error);
      return res.status(503).json({
        message: "We could not send a verification email. Check the email configuration and try again.",
      });
    }

    return res.status(201).json({
      message: "A verification code has been sent to your email",
      email: user.email,
      verificationRequired: true,
    });
  } catch (error) {
    console.error("REGISTER USER ERROR:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    return res.status(500).json({ message: "Unable to register user" });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body || {};
  if (
    typeof email !== "string" ||
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  ) {
    return res.status(400).json({ message: "Enter the email address and six-digit code" });
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Invalid or expired verification code" });
    if (user.verified) return res.status(409).json({ message: "This email is already verified" });

    const now = new Date();
    if (
      !user.verificationOtpHash ||
      !user.verificationOtpExpiresAt ||
      user.verificationOtpExpiresAt <= now
    ) {
      return res.status(400).json({ message: "This code has expired. Request a new one." });
    }
    if (user.verificationOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Too many incorrect attempts. Request a new code." });
    }

    const expected = Buffer.from(user.verificationOtpHash, "hex");
    const received = Buffer.from(hashOtp(normalizedEmail, code), "hex");
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      await User.updateOne(
        { _id: user._id, verified: false, verificationOtpAttempts: { $lt: MAX_OTP_ATTEMPTS } },
        { $inc: { verificationOtpAttempts: 1 } },
      );
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    const result = await User.updateOne(
      {
        _id: user._id,
        verified: false,
        verificationOtpHash: user.verificationOtpHash,
        verificationOtpExpiresAt: { $gt: now },
      },
      {
        $set: {
          verified: true,
          verificationOtpHash: null,
          verificationOtpExpiresAt: null,
          verificationOtpSentAt: null,
          verificationOtpAttempts: 0,
        },
      },
    );
    if (result.modifiedCount !== 1) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    return res.status(200).json({
      message: "Email verified successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    return res.status(500).json({ message: "Unable to verify email" });
  }
};

exports.resendVerification = async (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }

  try {
    const user = await User.findOne({ email: normalizeEmail(email), verified: false });
    if (!user) {
      return res.status(200).json({
        message: "If this account needs verification, a new code will be sent when eligible.",
      });
    }

    const cooldownUntil = user.verificationOtpSentAt
      ? user.verificationOtpSentAt.getTime() + OTP_RESEND_WAIT_MS
      : 0;
    if (Date.now() < cooldownUntil) {
      return res.status(429).json({ message: "Wait a minute before requesting another code." });
    }

    await sendVerificationCode(user);
    return res.status(200).json({ message: "A new verification code has been sent" });
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);
    return res.status(503).json({ message: "Unable to send a verification code; check email settings" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.verified) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before signing in",
      });
    }
    return res.json(publicUser(user));
  } catch (error) {
    console.error("LOGIN USER ERROR:", error);
    return res.status(500).json({ message: "Unable to log in" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select(
      "-password -verificationOtpHash -verificationOtpExpiresAt -verificationOtpSentAt -verificationOtpAttempts",
    );
    return res.json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return res.status(500).json({ message: "Unable to retrieve users" });
  }
};
