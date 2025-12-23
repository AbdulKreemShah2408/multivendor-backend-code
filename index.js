const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");
require('dotenv').config();

// Controllers (Same as before)
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

// --- CONFIGURATION ---

// 1. CORS Configuration
const allowedOrigins = [
  "https://multivendor-fronted.vercel.app", 
  "http://localhost:5173" 
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 2. Body Parser Limits (YE SABSE UPAR HONA CHAHIYE)
// Note: Vercel Free plan ki hard limit 4.5MB hai, isse zyada file nahi chalegi.
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// --- DATABASE ---
let isConnected = false;
const connectDatabase = async () => {
  if (isConnected) return;
  try {
    const mongoURI = process.env.DB_URL;
    if (!mongoURI) throw new Error("DB_URL missing");
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

app.use(async (req, res, next) => {
  await connectDatabase();
  next();
});

// --- ROUTES ---
app.use("/api/v2/user", user);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/order", order);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);

app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "Backend running on Vercel",
    dbStatus: isConnected ? "Connected" : "Disconnected"
  });
});

// --- ERROR HANDLING ---
app.use(ErrorHandler);

module.exports = app;