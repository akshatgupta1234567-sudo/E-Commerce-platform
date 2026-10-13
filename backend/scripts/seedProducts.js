const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Product = require("../model/product");

const sampleProducts = [
  {
    name: "Mild Steel Square Tube",
    description: "Versatile hollow steel section for frames, supports, and general fabrication.",
    price: 850,
    category: "Steel Sections",
    stock: 45,
  },
  {
    name: "Galvanized Steel Round Pipe",
    description: "Corrosion-resistant round pipe for workshop, utility, and light construction projects.",
    price: 1250,
    category: "Pipes & Tubes",
    stock: 32,
  },
  {
    name: "Mild Steel Angle Bar",
    description: "L-shaped steel section for brackets, reinforcements, and sturdy fabricated frames.",
    price: 690,
    category: "Steel Sections",
    stock: 60,
  },
  {
    name: "Hot Rolled Steel Flat Bar",
    description: "Dependable flat steel stock for repairs, fixtures, and custom metalwork.",
    price: 540,
    category: "Steel Sections",
    stock: 75,
  },
  {
    name: "Welded Wire Mesh Panel",
    description: "Rigid welded mesh panel for partitions, guards, and practical site enclosures.",
    price: 980,
    category: "Mesh & Sheet",
    stock: 28,
  },
  {
    name: "Mild Steel Plate",
    description: "General-purpose plate stock for fabrication, brackets, and workshop repairs.",
    price: 1650,
    category: "Mesh & Sheet",
    stock: 22,
  },
  {
    name: "Stainless Steel Round Bar",
    description: "Smooth stainless round stock for fixtures and corrosion-resistant fabrication.",
    price: 1420,
    category: "Steel Sections",
    stock: 19,
  },
  {
    name: "Reinforcing Steel Rod",
    description: "Ribbed reinforcement bar for concrete work and construction projects.",
    price: 760,
    category: "Construction",
    stock: 90,
  },
];

async function seedProducts() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI in backend/.env before seeding sample products");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  for (const product of sampleProducts) {
    await Product.updateOne(
      { name: product.name },
      {
        $setOnInsert: {
          ...product,
          imageurls: "/images/steel-stock.svg",
        },
      },
      { upsert: true },
    );
  }
  console.log(`Sample catalog ready (${sampleProducts.length} products; existing products were kept).`);
}

seedProducts()
  .catch((error) => {
    console.error("Unable to seed products:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
