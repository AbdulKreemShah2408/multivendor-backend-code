const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"please enter your name!"],
    },
    email:{
        type:String,
        required:[true,"please enter your email!"],
    },
    password:{
        type:String,
        required:[true,"please enter your password"],
        minLength:[4,"Password should be greater than the 4 characters"],
        select:false,
    },
    phoneNumber:{
        type:Number,
    },
    addresses:[
    { 
       country: {
        type:String,
       },
       city:{
        type:String,
       },
       address1:{
        type:String,
       },
       address2:{
        type:String,
       },
       zipCode:{
        type:Number,
       },
       addressType:{
        type:String,
       },

        
    }],
   role: {
        type:String,
        default:"user",
    },
    avatar:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        },
    },
    createdAt:{
        type:Date,
        default:Date.now(),
    },
    resetPasswordToken:String,
    resetPasswordTime:Date,
});


userSchema.pre("save",async function (next){
    if(!this.isModified("password")){
        return next();
    }
    this.password=await bcrypt.hash(this.password,10);
    next();
});


userSchema.methods.comparePassword=async function (enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
};

userSchema.methods.getJwtToken=function () {
  return jwt.sign({id:this._id},process.env.JWT_SECRET,{
    expiresIn:process.env.JWT_EXPIRES,
  });
};

module.exports=mongoose.model("User",userSchema);

