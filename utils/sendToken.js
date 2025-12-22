// create a token and saving in the cookies
const sendToken=(user,statusCode,res)=>{
 const token=user.getJwtToken();
  //options for cookies
  const options={
    httpOnly: true,               // fix case
  expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  sameSite: process.env.NODE_ENV === "PRODUCTION" ? "none" : "lax",
  secure: process.env.NODE_ENV === "PRODUCTION", // secure true in prod (https)
    
  }
  res.status(statusCode).cookie("token",token,options).json({
    message:"successfully user verified",
    success:true,
    user,
    token
  })

}

module.exports=sendToken;