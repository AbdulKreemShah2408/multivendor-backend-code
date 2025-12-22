const ErrorHandler=require('../utils/ErrorHandler');
const jwt=require("jsonwebtoken");
const catchAsyncErrors=require("./catchAsyncErrors");
const User=require("../model/user");
const Shop = require('../model/shop');
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {

  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    
  } catch (error) {
    return next(new ErrorHandler("Token expired or invalid", 401));
  }

  req.user = await User.findById(decoded.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found", 404));
  }

  next();
});

// exports.isAuthenticated=catchAsyncErrors(async(req,res,next)=>{
//      const {token}=req.cookies;
//      if(!token){
//         return next(new ErrorHandler("please login to continue",401));
//      }
//      const decode=jwt.verify(token,process.env.JWT_SECRET_KEY);
//      req.user=await User.findById(decode.id);
//      next();
// })
// exports.isSeller=catchAsyncErrors(async(req,res,next)=>{
//      const {seller_token}=req.cookies;
//      if(!seller_token){
//         return next(new ErrorHandler("please login to continue",401));
//      }
//      const decode=jwt.verify(seller_token,process.env.JWT_SECRET_KEY);
//      req.seller=await Shop.findById(decode.id);
//      next();
// })
exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.seller_token;

  if (!token) {
    return next(new ErrorHandler("please login to continue", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.seller = await Shop.findById(decoded.id);

    if (!req.seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }
    next();

  } catch (err) {
    return next(new ErrorHandler("Token expired or invalid", 401));
  }
});


