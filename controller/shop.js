const express = require("express");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const cloudinary = require("../cloudinary");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/sendToken");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {isAuthenticated, isSeller}=require("../middleware/auth");
const sendShopToken = require("../utils/shopToken");
const shop = require("../model/shop");

const router = express.Router();

router.post("/create-shop", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password, address, phoneNumber, zipCode } = req.body;

    // Check if shop exists
    const existingShop = await Shop.findOne({ email });
    if (existingShop) {
      return next(new ErrorHandler("Shop already exists", 400));
    }

    // Avatar required
    if (!req.file) {
      return next(new ErrorHandler("Please upload a shop avatar", 400));
    }

    // Upload image to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: "shop_avatars" },
      async (error, result) => {
        if (error) return next(new ErrorHandler(error.message, 500));

        const shopData = {
          name,
          email,
          password,
          address,
          phoneNumber,
          zipCode,
          avatar: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        };

        // Create activation token
        const activationToken = createActivationToken(shopData);
        const activationUrl = `http://localhost:5173/seller/activation/${activationToken}`;

        try {
          // send email
          await sendMail({
            email: shopData.email,
            subject: "Activate your Shop",
            message: `Hello ${shopData.name}, please click the link to activate your shop account: ${activationUrl}`,
          });

          res.status(201).json({
            success: true,
            message: `Please check your email (${shopData.email}) to activate your shop.`,
          });

        } catch (mailError) {
          return next(new ErrorHandler(mailError.message, 500));
        }
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
});

// Create Activation Token
const createActivationToken = (shopData) => {
  return jwt.sign({
     name: shopData.name,
      email: shopData.email,
      password: shopData.password,
      address: shopData.address,
      zipCode: shopData.zipCode,
      phoneNumber: shopData.phoneNumber,
      avatar: shopData.avatar,
  }, process.env.ACTIVATION_SECRET, {
    expiresIn: "15m",
  });
};


router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newShop = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newShop) {
        return next(new ErrorHandler("Invalid or expired token", 400));
      }

      const { name, email, password, avatar, zipCode, phoneNumber, address } =
        newShop;

      let seller = await Shop.findOne({ email });
      if (seller) {
        return next(new ErrorHandler("Shop already exists", 400));
      }

      seller = await Shop.create({
        name,
        email,
        password,
        avatar,
        zipCode,
        phoneNumber,
        address,
      });

      sendShopToken(seller, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//login shop
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      const seller = await Shop.findOne({ email }).select("+password");
      if (!seller) {
        return next(new ErrorHandler("User doesn't exit!", 400));
      }
      const isPasswordValid = await seller.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }
      sendShopToken(seller, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
//load user
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      
      const seller= await Shop.findById(req.seller._id);
      if (!seller) {
        return next(new ErrorHandler("user doesn't exit!", 400));
      }
      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      next(error)
    }
  })
);

//logout a shop user
router.get("/logout",catchAsyncErrors(async(req,res,next)=>{
  try {
    res.cookie("seller_token",null,{
      expires: new Date(Date.now()),
      httpOnly:true,

    });
    res.status(201).json({
      success:true,
      message:"Log out SuccessFull"
    })
  } catch (error) {
    return next(new ErrorHandler(error.message,500));
  }
}));

//get a shop info
router.get("/get-shop-info/:id",catchAsyncErrors(async(req,res,next)=>{
  try {
    const shop=await Shop.findById(req.params.id);
    res.status(201).json({
      success:true,
      shop,
    })
  } catch (error) {
      return next(new ErrorHandler(error.message,500));
  }
}));

// update seller avatar
router.put(
  "/update-shop-avatar",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await Shop.findById(req.seller._id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

     
      if (req.body.avatar && req.body.avatar !== "") {

        
        if (user.avatar?.public_id) {
          await cloudinary.uploader.destroy(user.avatar.public_id);
        }

      
        const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
          folder: "avatars",
          width: 150,
          crop: "scale",
        });


        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: "Avatar updated successfully!",
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//update seller info 
router.put("/update-seller-info",isSeller,catchAsyncErrors(async(req,res,next)=>{
  try {
    const {name,description,address,phoneNumber,zipCode}=req.body;
    const shop=await Shop.findOne(req.seller._id);
    if(!shop){
      return next(new ErrorHandler("User doesn't exit!", 400));
    }
    
     shop.name = name;
      shop.description = description;
      shop.address = address;
      shop.phoneNumber = phoneNumber;
      shop.zipCode = zipCode
      await shop.save();
      res.status(201).json({
        success:true,
        shop,
      })
  } catch (error) {
     return next(new ErrorHandler(error.message,500));
  }
}));

module.exports = router;
