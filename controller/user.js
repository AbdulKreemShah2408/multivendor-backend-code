
const express = require("express");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const cloudinary = require("../cloudinary");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/sendToken");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();


router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("User already exists", 400));
    }

    if (!req.file) {
      return next(new ErrorHandler("Please upload an avatar image", 400));
    }

   
    const stream = cloudinary.uploader.upload_stream(
      { folder: "avatars" },
      async (error, result) => {
        if (error) return next(new ErrorHandler(error.message, 500));

    
        const userData = {
          name,
          email,
          password,
          avatar: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        };

        const activationToken = createActivationToken(userData);
        const activationUrl = `${process.env.FRONTEND_URL}/activation/${activationToken}`;

      
        try {
          await sendMail({
            email: userData.email,
            subject: "Activate your account",
            message: `Hello ${userData.name}, please click the link to activate your account: ${activationUrl}`,
          });

          res.status(201).json({
            success: true,
            message: `Please check your email (${userData.email}) to activate your account.`,
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

const createActivationToken = (userData) => {
  return jwt.sign(userData, process.env.ACTIVATION_SECRET, {
    expiresIn: "15m",
  });
};


router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUserData = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newUserData) {
        return next(new ErrorHandler("Invalid or expired token", 400));
      }

      const existingUser = await User.findOne({ email: newUserData.email });
      if (existingUser) {
        return next(new ErrorHandler("User already exists", 400));
      }

      // Create actual user in DB
      const user = await User.create(newUserData);

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("User doesn't exit!", 400));
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//load a user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return next(new ErrorHandler("User doesn't exit!", 400));
      }
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {}
  })
);
// logout user
router.get("/logout",catchAsyncErrors(async(req,res,next)=>{
  try {
    res.cookie("token",null,{
      expires: new Date(Date.now()),
      httpOnly:true,
      sameSite: "none",
      secure: true,

    });
    res.status(201).json({
      success:true,
      message:"Log out SuccessFull"
    })
  } catch (error) {
    return next(new ErrorHandler(error.message,500));
  }
}));

// update a user info 
router.put("/update-user-info",isAuthenticated,catchAsyncErrors(async(req,res,next)=>{
  try {
    const {email,password,phoneNumber,name}=req.body;
    const user=await User.findOne({email}).select("+password");
    if(!user){
      return next(new ErrorHandler("User doesn't exit!", 400));
    }
     const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }
      user.name=name;
      user.email=email;
      user.phoneNumber=phoneNumber;
      await user.save();
      res.status(201).json({
        success:true,
        user,
      })
  } catch (error) {
     return next(new ErrorHandler(error.message,500));
  }
}));

// update a user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

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

// update user address
router.put("/update-user-address",isAuthenticated,catchAsyncErrors(async(req,res,next)=>{
  try {
    const user=await User.findById(req.user.id);
    const sameAddressType=user.addresses.find((address)=>address.addressType===req.body.addressType);
    if(sameAddressType){
      return next(new ErrorHandler(`${req.body.addressType} address already exist!`));
    }
    const existsAddress=user.addresses.find((address)=>address._id===req.body._id);
    if(existsAddress){
      Object.assign(existsAddress,req.body);
    }
    else{
      //add a new address to the array
      user.addresses.push(req.body);
    }
    await user.save();
    res.status(200).json({
      success:true,
      user,
    })
  } catch (error) {
     return next(new ErrorHandler(error.message, 500));
  }
}));

// delete user address 
router.delete("/delete-user-address/:id",isAuthenticated,catchAsyncErrors(async(req,res,next)=>{
  try {
    const userId=req.user._id;
    const addressId=req.params.id;
    await User.updateOne({
      _id:userId
    },{$pull:{addresses:{_id:addressId}}});
    const user=await User.findById(userId);
    res.status(200).json({ success: true, user });
  } catch (error) {
     return next(new ErrorHandler(error.message, 500));
  }
}));

// update user password
router.put("/update-user-password",isAuthenticated,catchAsyncErrors(async(req,res,next)=>{
  try {
     const user=await User.findById(req.user.id).select("+password");
     const isPasswordMatched=await user.comparePassword(req.body.oldPassword);
     if(!isPasswordMatched){
      return next(new ErrorHandler("Old password is incorrect!",400));
     }
     if(req.body.newPassword !== req.body.confirmPassword){
      return next(new ErrorHandler("Password doesn't matched with each other!",400));
     }
     user.password=req.body.newPassword;
     await user.save();
     res.status(200).json({
      success:true,
      message:"Password updated successfull!",
      user,
     })
  } catch (error) {
     return next(new ErrorHandler(error.message, 500));
  }
}));

// find user information with userId
router.get("/user-info/:id",catchAsyncErrors(async(req,res,next)=>{
  try {
    const user=await User.findById(req.params.id);
    res.status(201).json({
      success:true,
      user,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}))
module.exports = router;
