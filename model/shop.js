const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please enter your shop name!"],
  },
  email: {
    type: String,
    required: [true, "please enter your shop email!"],
  },
  password: {
    type: String,
    required: [true, "please enter your password"],
    minLength: [4, "Password should be greater than the 4 characters"],
    select: false,
  },
  description: {
    type: String,
  },
  phoneNumber: {
    type: Number,
  },
  address: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    default: "Seller",
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  zipCode: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});


shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


shopSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
};

module.exports = mongoose.model("Shop", shopSchema);
