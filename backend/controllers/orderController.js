const Order = require("../model/Order");
const Product = require("../model/product");
const sendEmail = require("../utils/sendEmail");
const { getRazorpay, verifyPaymentSignature } = require("./paymentController");

const createOrder = async (req, res) => {
  const decrementedProducts = [];
  let orderSaved = false;
  try {
    const { items, address, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !address ||
      !address.fullName ||
      !address.street ||
      !address.city ||
      !address.postalCode ||
      !verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    ) {
      return res.status(400).json({
        message: "Invalid order data",
      });
    }

    const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
    if (existingOrder) {
      return res.status(409).json({ message: "This payment has already been used for an order" });
    }

    const razorpay = getRazorpay();
    const [payment, paymentOrder] = await Promise.all([
      razorpay.payments.fetch(razorpay_payment_id),
      razorpay.orders.fetch(razorpay_order_id),
    ]);
    if (
      payment.status !== "captured" ||
      payment.order_id !== razorpay_order_id ||
      payment.amount !== paymentOrder.amount ||
      payment.currency !== "INR" ||
      paymentOrder.currency !== "INR" ||
      paymentOrder.notes?.userId !== req.user._id.toString()
    ) {
      return res.status(400).json({ message: "Payment is not captured for this account" });
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

    let totalAmount = 0;
    const orderItems = products.map((product) => {
      const quantity = requestedItems.get(product._id.toString());
      if (product.stock < quantity) {
        const error = new Error(`${product.name} does not have enough stock`);
        error.statusCode = 409;
        throw error;
      }
      totalAmount += product.price * quantity;
      return { product: product._id, quantity, price: product.price };
    });

    if (Math.round(totalAmount * 100) !== payment.amount) {
      return res.status(400).json({ message: "Paid amount does not match the current product total" });
    }

    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );
      if (!updatedProduct) {
        const error = new Error("A product no longer has enough stock");
        error.statusCode = 409;
        throw error;
      }
      decrementedProducts.push(item);
    }

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      address,
      paymentId: razorpay_payment_id,
    });

    await order.save();
    orderSaved = true;

    const message = `
Dear ${req.user.name},

Thank you for your order!

Order ID: ${order._id}
Total Amount: ₹${totalAmount}

Your order has been placed successfully.

Regards,
Iron & Steel Trade Supply Co.
`;

    try {
      await sendEmail(req.user.email, "Order Created", message);
    } catch (emailError) {
      console.error("ORDER CONFIRMATION EMAIL ERROR:", emailError);
    }

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:");
    console.error(error);

    if (!orderSaved && decrementedProducts.length) {
      const restoration = await Promise.all(
        decrementedProducts.map((item) =>
          Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
          ),
        ),
      );
      if (restoration.some((result) => result.matchedCount !== 1)) {
        console.error("ORDER INVENTORY RESTORATION INCOMPLETE:", decrementedProducts);
      }
    }
    if (error.statusCode === 409) return res.status(409).json({ message: error.message });
    return res.status(500).json({ message: "Unable to create order" });
  }
};

const myOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).populate("items.product", "name price imageurls");

    res.json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to retrieve orders",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .populate("items.product", "name price imageurls");

    res.json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to retrieve orders",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;

    await order.save();

    res.json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to update order status",
    });
  }
};

module.exports = {
  createOrder,
  myOrders,
  getOrders,
  updateOrderStatus,
};