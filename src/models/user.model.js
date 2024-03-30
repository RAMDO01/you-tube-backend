import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema(
    {
        fullName:{
            type: String,
            required: true,
            toLowerCase: true,
            index: true
        },
        username:{
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowerCase: true,
        },
        avatar:{
            type:String, //cloudinary url
        },
        coverImage:{
            type:String  //cloudinary url
        },
        totalVideoUpload:{
            type:Number,
            default: 0
        },
        accountType: {
            type:String,
            enum:["Admin","User"]
        },
        watchHistory:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },
    {timestamps:true}
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return null

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)