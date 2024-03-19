import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import {extractPublicId} from "cloudinary-build-url"


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const fileUploadOnCloudinary = async (localPath, folder, resourceType, height, width, quality) => {
    try {
        if(!localPath) return null

        const options = {folder}

        if(height) {
            options.height = height
        }
        if(width){
            options.width = width
        }
        if(quality){
            options.quality = quality
        }

        options.resource_type = resourceType

        const response = await cloudinary.uploader.upload(localPath,options)
        fs.unlinkSync(localPath)
        return response
    } catch (error) {
        fs.unlinkSync(localPath)
        console.log("ERROR: error in file uploading on cloudinary",error)
        return null
    }
}




const destroyFileFromCloudinay = async(fileUrl , resourceType) => {
    try {
        if(!fileUrl) return null
        //extract public id form the url
        const publicId = extractPublicId(fileUrl)
        console.log("this public id of current file ",publicId)

        await cloudinary.uploader.destroy(publicId,
            {
                resource_type:`${resourceType}`
            })
            console.log("old file is deleted")
            return
    } catch (error) {
        console.log("ERROR: error in file destroy on cloudinary",error)
    }
}

export {fileUploadOnCloudinary, destroyFileFromCloudinay}