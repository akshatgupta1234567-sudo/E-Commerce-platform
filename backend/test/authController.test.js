const assert = require("node:assert/strict");
const test = require("node:test");
const { registerUser, verifyEmail, resendVerification } = require("../controllers/authController");

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("registration rejects invalid fields before accessing the database", async () => {
  const res = response();
  await registerUser({ body: { name: "A", email: "bad-email", password: "short" } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /valid name, email, and password/);
});

test("email verification requires a six-digit code", async () => {
  const res = response();
  await verifyEmail({ body: { email: "person@example.com", code: "123" } }, res);
  assert.equal(res.statusCode, 400);
});

test("resend verification validates the email address", async () => {
  const res = response();
  await resendVerification({ body: { email: "not-an-email" } }, res);
  assert.equal(res.statusCode, 400);
});
