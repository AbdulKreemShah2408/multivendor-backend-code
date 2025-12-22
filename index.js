const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverless = require("serverless-http");

const ErrorHandler = require("./middleware/error");

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

  await mongoose.connect(mongoURI);
  isConnected = true;
  console.log("✅ MongoDB connected");
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

/* ================= TEST ================= */
app.get("/", async (req, res) => {
  await connectDatabase();
  res.json({ success: true, message: "Backend running on Vercel" });
});

app.use(ErrorHandler);

/* ================= EXPORT ================= */
module.exports = serverless(async (req, res) => {
  await connectDatabase();
  return app(req, res);
});
