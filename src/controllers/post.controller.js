import User from "../models/user.model.js"
import Post from "../models/post.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { fileUploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


//create the post
const createPost = asyncHandler(async(req, res) => {
    const {title} = req.body
    const postImgLocalPath = req.file?.path;

    if(!title) {
        return new ApiError(404,"title is required")
    }

    if(!postImg) {
        return new ApiError(404,"post image is required")
    }

    //uploade the image on cloudinary
    const photos = await fileUploadOnCloudinary(
        postImgLocalPath,
        process.env.POST_FILE,
        "image"
    )

    if(!photos.url){
        return new ApiError(404,"post is not uploaded on cluodinary")
    }
    
    const post = await Post.create({
        imageUrl:photos.url,
        title,
        owner:req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,post,"post is created")
    )
}) 


//delete the post
const deletePost = asyncHandler(async(req, res) =>{
    const {postId} = req.body;
    if(!postId){
        return new ApiError(404,"post id is missing")
    }

    await Post.findByIdAndDelete(postId)
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Post is deleted")
    )
})

//fecth the post by id
const fetchPost = asyncHandler(async(req, res) => {
    const {postId} = req.body;
    if(!postId) {
        return new ApiError(404,"post id is missing")
    }

    const post = Post.findById(postId)
    if(!post) {
        return new ApiError(404,"Post is not aviable")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,post,"Post is fetched")
    )
})

//update the post 
const updatePostDescription = asyncHandler(async(req, res) => {
    const {postId, description} = req.body;
    if(!description) {
        return new ApiError(404, "description is required to update the post description")
    }
    if(!postId) {
        return new ApiError(404, "post id is missing")
    }

    const updatedPost = await Post.findByIdAndUpdate(
        {postId},
        {
            $set:{
                description:description
            }
        },
        {new :true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedPost,"post is update")
    )
})


//update the image post
const updatePostImage = asyncHandler(async(req, res) => {
    const {postId} = req.body;
    const postImageLoacalPath = req.file?.path;
    if(!postId || !postImageLoacalPath) {
        return  new ApiError(404, "All fields are required")
    }
    const oldPost = await Post.findById(postId)
    


    const image = await fileUploadOnCloudinary(postImageLoacalPath,process.env.POST_FILE,"image")
})









