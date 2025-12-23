// // create a token and saving in the cookies
// const  sendShopToken=(seller,statusCode,res)=>{
//  const token=seller.getJwtToken();
//   //options for cookies
//   const options={
//     httpOnly:true,
//     expires:new Date(Date.now()+90*24*60*60*1000),

//   }
//   res.status(statusCode).cookie("seller_token",token,options).json({
//     message:"successfully user verified",
//     success:true,
//     seller,
//     token
//   })

// }

// module.exports= sendShopToken;
const jwt = require("jsonwebtoken");
const sendShopToken = (seller, statusCode, res) => {
  const token = jwt.sign(
    { id: seller._id }, // ✔ ONLY SEND ID
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const options = {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  };

  res.status(statusCode).cookie("seller_token", token, options).json({
    message: "successfully user verified",
    success: true,
    seller,
    token,
  });
};

module.exports = sendShopToken;
