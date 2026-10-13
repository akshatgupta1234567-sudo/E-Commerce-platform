const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

process.env.RAZORPAY_KEY_SECRET = "test-only-secret";
const { verifyPaymentSignature } = require("../controllers/paymentController");

test("accepts a matching Razorpay order signature", () => {
  const orderId = "order_test_123";
  const paymentId = "pay_test_456";
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  assert.equal(verifyPaymentSignature(orderId, paymentId, signature), true);
});

test("rejects a signature for a different order or malformed data", () => {
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update("order_test_123|pay_test_456")
    .digest("hex");

  assert.equal(verifyPaymentSignature("order_test_other", "pay_test_456", signature), false);
  assert.equal(verifyPaymentSignature("order_test_123", "pay_test_456", "invalid"), false);
  assert.equal(verifyPaymentSignature(null, "pay_test_456", signature), false);
});
