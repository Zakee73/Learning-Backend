import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

const uploadOnCloudinary  = async (localFilePath) =>{
    try { 
if(!localFilePath) return null

// uploading the file on cloudinary
const response = await cloudinary.uploader.upload(localFilePath , {resource_type : "auto"})
// file has uploaded successfully

console.log("file is uploaded on cloudinary")
console.log(response)
return response;
    } catch (error)
    {
         fs.unlinkSync(localFilePath)  // remove the locally saved temporarily file as the upload operation got failed
    }
}

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
     api_keys : process.env.CLODINARY_API,
     api_secret : process.env.CLODINARY_API_SECRET
});

export {uploadOnCloudinary}