const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

const ErrorHandler = require("./middleware/error");
require('dotenv').config();


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


let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return;

  try {
    const mongoURI = process.env.DB_URL;
    if (!mongoURI) throw new Error("DB_URL missing");


    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};
const allowedOrigins = [
  "https://multivendor-fronted.vercel.app", 
  "http://localhost:5173" 
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));



app.use(async (req, res, next) => {
  await connectDatabase();
  next();
});


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

app.use((err, req, res, next) => {
  console.error("Caught Error:", err);
  const statusCode = Number(err.statusCode) || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
app.use(ErrorHandler);


module.exports = app;