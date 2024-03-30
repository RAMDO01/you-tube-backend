import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Category } from "../models/videoCategory.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { fileUploadOnCloudinary, destroyFileFromCloudinay } from "../utils/cloudinary.js"


//upload the video
const uploadVideo =  asyncHandler(async(req, res) => {

    //fetch all data form forntend
    let {title, tags, description, categoryId, isPublished, status} = req.body;
    const videoLocalPath = req.file?.path;
    const thumbnailLocalPath = req.file?.path;

    if(
        [title, tags, description, categoryId].some((field) => field.tirm() === "")
    ){
        throw new ApiError(404, "All fields are required")
    }
    if(!videoLocalPath){
        throw new ApiError(404, "Video is requried")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(404, "thumbnail is required")
    }

    if(!isPublished || isPublished === undefined){
        isPublished = true
    }

    if(!status || status === undefined){
        status = "private"
    }

    //find the video category
    const categoryDetails = await Category.findById(categoryId)
    if(!categoryDetails) {
        throw new ApiError(404, "video categroy is defined")
    }
    //upload the video on cloudinary
    const video = await fileUploadOnCloudinary(
        videoLocalPath,
        process.env.VIDO_FOLDER,
        "video"
        );
    if(!video.url) {
        throw new ApiError(404, "error in video uploading")
    }
    //thumbnail uploading
    const thumbnail = await fileUploadOnCloudinary(
        thumbnailLocalPath,
        process.env.VIDEO_THUMBNAIL_FOLDER,
        "image"
        );

    if(!thumbnail.url) {
        throw new ApiError(404, "error in thumbnail uploadin")
    }

    //create the video object in db
    const videoObj = await Video.create({
        videoFile:video.secure_url,
        thumbnail:thumbnail.secure_url,
        title,
        tags,
        description,
        category:categoryDetails._id,
        duration:video.duration,
        isPublished:isPublished,
        status:status,
        owner:req.user._id
    });

    const videoDetails = await Video.findById(videoObj._id)
    if(!videoDetails) {
        throw new ApiError(499, "video is not creating")
    }

    //increase the number of video in user model
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                totalVideoUpload:totalVideoUpload+1
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video is uploaded successfully")
    )
})

//delete the video
const deleteVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.body
    if(!videoId){
        throw new ApiError(404, "video id is missing")
    }
    //fetch the video
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "video is not avaliable")
    }
    const videoUrl = video.videoFile;
    const thumbnailUrl = video.thumbnail;
    //first we delete the thumbnail and video form cloudinary
    await destroyFileFromCloudinay(videoUrl,"video")
    await destroyFileFromCloudinay(thumbnailUrl,"image")
    //delete the video form video model
    await Video.findByIdAndDelete(videoId)
    //decrease the video nm=umber form user model
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                totalVideoUpload:totalVideoUpload-1
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {} ,"video is delete")
    )

})

//update the video tumbnail
const updateVideoThumbnail = asyncHandler(async(req, res) => {
    const {videoId} = req.body
    if(!videoId) {
        throw new ApiError(404, "video id is missing")
    }

    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath){
        throw new ApiError(404,"thumbnail local path is missing")
    }

    //first we delete the old thumbnail
    const video = await Video.findById(videoId)
    const oldThumbnailUrl = video.thumbnail
    await destroyFileFromCloudinay(oldThumbnailUrl,"image")

    //second upload the new thumbnail on clouidnary
    const newThumbnail = await fileUploadOnCloudinary(
        thumbnailLocalPath,
        process.env.VIDEO_THUMBNAIL_FOLDER,
        "image"
        );
    if(!newThumbnail.url) {
        throw new ApiError(404,"thumbnail is no upload on cloudinary")
    }

    //update the video
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                thumbnail:newThumbnail?.url
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"video thumbnail is updated")
    )
    
})

//update the video title
const updateVideoTitle = asyncHandler(async(req, res) => {
    const {videoId, title} = req.body
    if(!videoId){
        throw new ApiError(404, "video id is missing")
    }
    if(!title) {
        throw new ApiError(404, "title is required for updating the video title")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title:title
            }
        },
        {new:true}
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"video title is updated")
    )
})

//update the video description
const updateVideoDescription = asyncHandler(async(req, res) => {
    const {videoId, description} = req.body
    if(!videoId){
        throw new ApiError(404, "video id is missing")
    }
    if(!title) {
        throw new ApiError(404, "title is required for updating the video title")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                description:description
            }
        },
        {new:true}
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"video description is updated")
    )
})

//update the video publisher
const changeVideoPublisher = asyncHandler(async(req, res) => {
    const {videoId, publish} = req.body
    if(!videoId){
        throw new ApiError(404, "video id is missing")
    }
    if(!publish) {
        throw new ApiError(404, "title is required for updating the video title")
    }
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:publish
            }
        },
        {new:true}
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"video publish is updated")
    )
})

//change video status
const changeVideoStatus = asyncHandler(async(req, res) => {
    const {videoId, status} = req.body

    if(!videoId){
        throw new ApiError(404, "video id is missing")
    }

    if(!status) {
        throw new ApiError(404, "status is required for updating the video status")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                status:status
            }
        },
        {new:true}
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"video status is changed")
    )
})

//get all video on the basis of new uploaded
const getNewUpladedVideo = asyncHandler(async(req, res) => {
    const video = await Video.find(
        {},
        {
            videoFile:true,
            thumbnail:true,
            description:true,
            title:true,
            category:true,
            status:"Public",
            isPublished:true,
            //owner:req.user._id
        }
        ).sort({createdAt:-1});

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"all video is fecthed")
    )
})
//get all video on the basis of old uplaoded
const getAllVideoOldUploaded = asyncHandler(async(req, res ) => {
    const oldUploaded = await Video.find(
    {},
    {
        videoFile:true,
        description:true,
        title:true,
        category:true,
        status:true,
        duration:true,
        isPublished:true,
    }).sort({createdAt:1})


    return res
    .status(200)
    .json(
        new ApiResponse(200,oldUploaded,"all video fetched on the basis of old uploaded")
    )
})

export {
    uploadVideo, 
    deleteVideo, 
    updateVideoThumbnail, 
    updateVideoTitle, 
    updateVideoDescription, 
    changeVideoPublisher,
    changeVideoStatus,
    getNewUpladedVideo,
    getAllVideoOldUploaded
}