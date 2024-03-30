import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//create the comment
const createComment = asyncHandler(async(req, res) => {
    const {videoId, content} = req.body
    if(!videoId){
        throw new ApiError(404, "video id is missing")
    }
    if(!content){
        throw new ApiError(404,"comment content is missing")
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        user:req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"comment is submit")
    )
})


//delete the comment
const deleteComment = asyncHandler(async(req, res) => {
    const {commentId} = req.body
    if(!commentId){
        throw new ApiError(404,"comment id is missing")
    }

    await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"comment is deleted")
    );
});


//fetch all the comment 


export {createComment, deleteComment}