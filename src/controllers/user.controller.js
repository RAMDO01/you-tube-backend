import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {fileUploadOnCloudinary, destroyFileFromCloudinay} from "../utils/cloudinary.js"


const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

//create Resgistration
const userRegistration = asyncHandler( async(req, res) => {
    //fetch all data form body
    //validate data
    //check user is present or not
    //import the avatar and cover image from frontend
    //upload them on cloudinary
    //create user object 
    //remove password and refresh token field form response
    //check user created or not
    //return response
    let {username, email, fullName, password, accontType} = req.body;

    if(
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(404, "All fields are required")
    }

    const existsUser = await User.findOne({
        $or: [{username},{email}]
    });

    if(existsUser) {
        throw new ApiError(409,"user is allready exists")
    }

    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.path;

    //upload them on cloudinary
    // const avatar = await fileUploadOnCloudinary(
    //     avatarLocalPath,
    //     process.env.USER_AVATAR,
    //     "image",
    //     150,
    //     150,
    //     50,
    //     )
    // const coverImage = await fileUploadOnCloudinary(
    //     coverImageLocalPath,
    //     process.env.USER_COVERIMAGE,
    //     "image",
    // )

    if(!accontType || accontType === undefined){
        accontType = "User"
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        // avatar:avatar.url || "",
        // coverImage:coverImage.url || "",
        password,
        accountType:accontType,
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdUser, "user registration successfull")
    )


})

//login
const userLogin = asyncHandler(async(req, res) => {
    const {username, email, password} = req.body
    if(!(username || email)){
        throw new ApiError(404, "username/email is required")
    }

    if(!password) {
        throw new ApiError(404, "password is required")
    }

    const userExists = await User.findOne(
        {$or:[{username},{email}]}
    )

    if(!userExists) {
        throw new ApiError(404, "User doesn't exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(404,"Password is incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(userExists._id);
    const loggedInUser = await User.findById(existsUser._id).select("-password -refreshToken")


    //send the token in cookie
    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully")
    )







})


//change the avatar
const changeAvatar = asyncHandler(async(req, res) => {
    
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath) {
        throw new ApiError(404, "Avatar is missing")
    }

    //delete the old avatar form cloudinary
    const user = await User.findById(req.user?._id)
    const oldAvatarUrl = user.avatar
    if(!oldAvatarUrl){
        return null
    } 

    await destroyFileFromCloudinay(oldAvatarUrl,"image")

    //upload on cloudinary
    const avatar = await fileUploadOnCloudinary(
        avatarLocalPath,
        process.env.USER_AVATAR,
        "image",
        200,
        200,
        50
    )
    if(!avatar.url) {
        throw new ApiError(404,"avatar image is not upload")
    }

    //update the user model
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    )

    const userDeatils = await User.findById(updatedUser._id).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, userDeatils, "avatar is set successfully")
    )

})

//change the conver image
const changeCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath) {
        throw new ApiError(404,"image is required")
    }

    //first we delete the old cover image
    const user = await User.findById(req.user?._id)
    const oldCoverImageUrl = user.coverImage;
    if(!oldCoverImageUrl){
        return null
    }
    await destroyFileFromCloudinay(oldCoverImageUrl,"image")

    //upload on cloudinary
    const coverImage = await fileUploadOnCloudinary(
        coverImageLocalPath,
        process.env.USER_COVER_IMAGE,
        "image",
        )

    if(!coverImage.url) {
        throw new ApiError(404,"conver image is not upload on cloudinary")
    }

    //update the user model
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    )
    
    const userDeatils = await User.findById(updatedUser._id).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200,userDeatils,"cover image is updated")
    )

})

//logout
const logout = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {new:true}
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"user is logout")
    )
})

//refresh the access token
const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if(!user) {
            throw new ApiError(401,"invaid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401,"Refresh token is not valid")
        }

        const options = {
            httpOnly: true,
            secure:true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access Token refreshed")
        )
    } catch (error) {
        throw new ApiError(500,error?.message || "invalid refresh token")
    }
})


//change the password
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmNewPassword} = req.body;
    if(!oldPassword || !newPassword || !confirmNewPassword) {
        throw new ApiError(404,"All fields are required")
    }

    //match the password
    if(newPassword !== confirmNewPassword) {
        throw new ApiError(404, "Password not match")
    }

    const user = await User.findById(req.user._id)

    //verify the password
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid) {
        throw new ApiError(404, "Password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "password is change successfully")
    )

})

//get current user details
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user, "user is fetched succesfully")
    )
})


export {
    userRegistration, 
    userRegistration, 
    userLogin,  
    changeAvatar,
    changeCoverImage,
    logout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser
}
