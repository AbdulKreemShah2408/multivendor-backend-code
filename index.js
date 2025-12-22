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

// Load env variables
require("dotenv").config();

const app = express();

// MongoDB connection function
const connectDatabase = async () => {
  const mongoURI = process.env.DB_URL || "";

  if (!mongoURI.startsWith("mongodb://") && !mongoURI.startsWith("mongodb+srv://")) {
    console.error("❌ Invalid MongoDB URI. It must start with 'mongodb://' or 'mongodb+srv://'");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Connect to DB before starting the app
connectDatabase();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// Routes
app.use("/api/v2/user", user);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/order", order);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ Multivendor backend is running on Vercel",
  });
});

// Error handler middleware
app.use(ErrorHandler);

// Export serverless handler
module.exports = serverless(app);
