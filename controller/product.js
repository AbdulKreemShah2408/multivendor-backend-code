const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const Shop = require("../model/shop");
const { upload } = require("../multer");
const Order=require("../model/order.js")
const cloudinary = require("../cloudinary.js");
const {isSeller, isAuthenticated}=require("../middleware/auth.js")
const fs = require("fs");
const path = require("path");
// create product shop

router.post(
  "/create-product",
  upload.array("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let imageUrls = [];
        for (let i = 0; i < req.files.length; i++) {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "products" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
              })
              .end(req.files[i].buffer);
          });

          imageUrls.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
        const ProductData = req.body;
        ProductData.images = imageUrls;
        ProductData.shop = shop;
        const product = await Product.create(ProductData);
        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products of the shop
router.get("/get-all-products-shop/:id",catchAsyncErrors(async(req,res,next)=>{
  try {
    const products=await Product.find({shopId:req.params.id});
     res.status(201).json({
          success: true,
          products,
        });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
}) );


// delete of a product shop

router.delete("/delete-shop-product/:id",isSeller,catchAsyncErrors(async(req,res,next)=>{
  try {
    const productId=req.params.id
    const productData=await Product.findById(productId);
    if(!productData){
      return next(new ErrorHandler("Product not found with this id",400));
    }

     productData.images.forEach(async(image) => {
                 await cloudinary.uploader.destroy(image.public_id)
            });
       const product = await Product.findByIdAndDelete(productId);
    res.status(201).json({
          success: true,
          message:"Product Delete successfully",
        });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
}));

// get all of the products of a shop
router.get("/get-all-products",catchAsyncErrors(async(req,res,next)=>{
  try {
    const products=await Product.find().sort({createdAt:-1});
    res.status(201).json({
      success:true,
      products,
    })
  } catch (error) {
      return next(new ErrorHandler(error, 400));
  }
}));


// review for a product
router.put("/create-new-review",isAuthenticated,    catchAsyncErrors((async(req,res,next)=>{
  try {
    const {user,rating,comment,productId,orderId}=req.body;
    const product=await Product.findById(productId);
    const review={
      user,
      rating,
      comment,
      productId,
    }
    const isReviewd=product.reviews.find((rev)=>rev.user._id===req.user._id);
    if(isReviewd){
      product.reviews.forEach((rev)=>{
        if(rev.user._id===req.user._id){
          (rev.rating=rating),(rev.comment=comment),(rev.user=user)
        }
      });
    }else{
      product.reviews.push(review)
    }
    let avg=0;
    product.reviews.forEach((rev)=>{
      avg +=rev.rating;
    });
    product.ratings=avg/product.reviews.length;
    await product.save({validateBeforeSave:false});
    await Order.findByIdAndUpdate(orderId,{$set:{"cart.$[elem].isReviewed":true}},{arrayFilters:[{"elem._id":productId}],new: true})
    res.status(200).json({
      success:true,
      message:"Reviwed successfully "
    })
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
})))







module.exports=router;
