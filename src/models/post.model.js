import mongoose, { Schema } from "mongoose";


const postSchema = new mongoose.Schema(
    {
        imgUrl:{   
            type:[String], // cloudinary uploaded image url
            required:true 
        },
        title:{
            type:String,
            required:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    }
)

export const Post = mongoose.model("Post",postSchema)