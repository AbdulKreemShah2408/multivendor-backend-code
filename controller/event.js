const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const { upload } = require("../multer");
const cloudinary = require("../cloudinary.js");
const Shop = require("../model/shop");
const Event=require("../model/event")
const {isSeller}=require("../middleware/auth.js")
router.post(
  "/create-event",
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
        const eventData = req.body;
        eventData.images = imageUrls;
        eventData.shopId = shopId; 
        
        eventData.shop = shop;
        const product = await Event.create(eventData);
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
// get all events
router.get("/get-all-events",catchAsyncErrors(async(req,res,next)=>{
  try {
    const events=await Event.find();
    res.status(201).json({
      success:true,
      events,
    })
  } catch (error) {
       return next(new ErrorHandler(error, 400));
  }
}))
// get all events of shop 
router.get("/get-all-events-shop/:id",catchAsyncErrors(async(req,res,next)=>{
  try {
    const events=await Event.find({shopId:req.params.id});
     res.status(201).json({
          success: true,
          events,
        });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
}) );

router.delete("/delete-shop-event/:id",isSeller,catchAsyncErrors(async(req,res,next)=>{
  try {
    const eventId=req.params.id
    const eventData=await Event.findById(eventId);
     eventData.images.forEach(async(image) => {
           await cloudinary.uploader.destroy(image.public_id)
      });
    if(!eventData){
      return next(new ErrorHandler("Event not found with this id",400));
    }

   
const event = await Event.findByIdAndDelete(eventId);
    res.status(201).json({
          success: true,
          message:"Event Delete successfully",
        });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
}));

module.exports=router;