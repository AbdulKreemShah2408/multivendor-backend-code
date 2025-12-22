const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverless = require("serverless-http");

const ErrorHandler = require("./middleware/error");
require('dotenv').config();

// Controllers
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const conversation = require("./controller/conversation");
const message = require("./controller/message");

const app = express();

/* ================= DB CONNECTION (SAFE FOR VERCEL) ================= */
let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return;

  const mongoURI = process.env.DB_URL;
  console.log("DB_URL =>", mongoURI ? "FOUND" : "MISSING");

  if (!mongoURI) {
    throw new Error("DB_URL is missing in environment variables");
  }

  try {
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;  // Rethrow so handler can catch and respond properly
  }
};

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

/* ================= ROUTES ================= */
app.use("/api/v2/user", user);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/order", order);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);

/* ================= TEST ROUTE ================= */
app.get("/", async (req, res) => {
  try {
    await connectDatabase();
    res.json({ success: true, message: "Backend running on Vercel" });
  } catch (error) {
    res.status(500).json({ success: false, error: "DB Connection failed" });
  }
});

app.use(ErrorHandler);

/* ================= SERVERLESS HANDLER ================= */
const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    if (!isConnected) {
      await connectDatabase();
    }
    return handler(req, res);
  } catch (error) {
    console.error("Error in serverless handler:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}