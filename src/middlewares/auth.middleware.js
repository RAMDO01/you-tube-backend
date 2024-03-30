import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
//import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"

//auth middleware
const auth = asyncHandler(async(req, _, next) => {
    const token = req.body.token || 
                  req.cookies?.token ||
                   req.header("Authorisation").replace("Bearer ","")

    if(!token ){
        throw new ApiError(404, "Unauthrized request")
    }

    try {
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET )
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        if(!user){
            //discuss about frontend
            throw new ApiError(401, "Invalid token")
        }
        req.user = user
        next()
    } catch (error) {
        throw ApiError(401, error?.message || "invalid access token")
    }
})


//isAdmin 
const isAdmin = asyncHandler(async(req, _, next) => {
    if(req.user.accountType !== "Admin"){
        throw new ApiError(499, "This route is only for Admin")
    }
    next()
})

//isUser 
const isUser = asyncHandler(async(req, _, next) => {
    if(req.user.accountType !== "User"){
        throw new ApiError(499, "this route is only for User")
    }
    next()
})


export {auth, isAdmin, isUser}

