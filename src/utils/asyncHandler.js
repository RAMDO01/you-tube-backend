import { ApiError } from "./ApiError"

// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next))
//         .catch((error) => next(error))
//     }
// }



const asyncHandler = (requestHandler) => async(req, res, next) => {
    try {
        return await requestHandler(req, res, next)
    } catch (error) {
        console.log("this is internal error .........",error)
        return res
        .status(error.code || 500)
        .json({
            success:false,
            message: "internal server error"
        })
        
        
    }
}

export {asyncHandler}

