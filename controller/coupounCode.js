const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const { upload } = require("../multer");
const cloudinary = require("../cloudinary.js");
const Shop = require("../model/shop");
const CoupounCode=require("../model/coupounCode")
const {isSeller}=require("../middleware/auth.js")


// create a coupoun code

router.post("/create-coupon-code",isSeller,catchAsyncErrors(async(req,res,next)=>{
    try {
        const isCoupounCodeExists=await CoupounCode.find({name:req.body.name});
        if(isCoupounCodeExists.length !== 0){
            return next(new ErrorHandler("Coupoun code already exits!", 400));
        }
        const coupounCode=await CoupounCode.create(req.body);
        res.status(201).json({
            success:true,
            coupounCode,
        })
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

// get a coupon code of a shop
router.get("/get-coupon/:id",isSeller,catchAsyncErrors(async(req,res,next)=>{
try {
    const couponCodes=await CoupounCode.find({shop:req.params.id});
     res.status(201).json({
            success:true,
            couponCodes,
        })
} catch (error) {
    return next(new ErrorHandler(error, 400));
}
}));

// delete a coupoun code of a shop
router.delete("/delete-coupon/:id",isSeller,catchAsyncErrors(async(req,res,next)=>{
    try {
        const couponCode=await CoupounCode.findByIdAndDelete(req.params.id);
        if(!couponCode){
            return next(new ErrorHandler("Coupon code dosen't exists!", 400));
        }
        res.status(201).json({
        success: true,
        message: "Coupon code deleted successfully!",
      });
    } catch (error) {
          return next(new ErrorHandler(error, 400));
    }
}));

// get coupon code value by its name
router.get("/get-coupon-value/:name",catchAsyncErrors(async(req,res,next)=>{
    try {
        const couponCode=await CoupounCode.findOne({name:req.params.name});
         res.status(200).json({
        success: true,
        couponCode,
      });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

// get coupon code value by its name
router.get("/get-coupon-value",catchAsyncErrors(async(req,res,next)=>{
    try {
        const couponCode=await CoupounCode.findOne({name:req.params.name});
        res.status(200).json({
            success:true,
            couponCode,
        })
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))

module.exports=router;