const crypto = require("crypto");
const Razorpay = require("razorpay");
const Product = require("../model/product");

const getRazorpay = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (
    typeof orderId !== "string" ||
    typeof paymentId !== "string" ||
    typeof signature !== "string" ||
    !/^[a-f\d]{64}$/i.test(signature) ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
};

const createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Add at least one product to your order" });
    }

    const requestedItems = new Map();
    for (const item of items) {
      const productId = item?.product;
      const quantity = Number(item?.quantity);
      if (
        typeof productId !== "string" ||
        !/^[a-f\d]{24}$/i.test(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({ message: "Order items are invalid" });
      }
      requestedItems.set(productId, (requestedItems.get(productId) || 0) + quantity);
    }

    const products = await Product.find({ _id: { $in: [...requestedItems.keys()] } });
    if (products.length !== requestedItems.size) {
      return res.status(400).json({ message: "One or more products are unavailable" });
    }

    let amount = 0;
    for (const product of products) {
      const quantity = requestedItems.get(product._id.toString());
      if (product.stock < quantity) {
        return res.status(409).json({ message: `${product.name} does not have enough stock` });
      }
      amount += Math.round(product.price * 100) * quantity;
    }
    if (!Number.isSafeInteger(amount) || amount < 1) {
      return res.status(400).json({ message: "Order total is invalid" });
    }

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
      notes: { userId: req.user._id.toString() },
    });
    return res.status(201).json(order);
  } catch (error) {
    console.error("CREATE PAYMENT ORDER ERROR:", error);
    return res.status(500).json({ message: "Unable to start payment" });
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ message: "Payment verification failed" });
  }
  return res.status(200).json({ message: "Payment signature verified" });
};

module.exports = { createOrder, verifyPayment, getRazorpay, verifyPaymentSignature };
