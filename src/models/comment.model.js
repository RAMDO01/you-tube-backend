import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        content:{
            type:String,
            required:true
        },
        video:{
            type:mongoose.Schema.Types.ObjectId,
            ref: "Video"
        },
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }, {timestamps:true}
)

export const Comment = mongoose.model("Comment",commentSchema)