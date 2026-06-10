import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import{uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) =>{
try{
const user  = await User.findById(userId)
const accessToken = user.generateAccessToken()
const refreshToken = user.generateRefreshToken()
// console.log(user)
// console.log(accessToken)
// console.log(refreshToken)
user.refreshToken  = refreshToken
 const saveUserData = await user.save({validateBeforeSave : false})
 if(!saveUserData){
    throw new ApiError(501 , "User data is not getting saved in generateAccessAndRefreshToken method")
 }
// console.log(accessToken)
// console.log(refreshToken)
return {accessToken , refreshToken}


} catch(error){
    // console.log(error.message)
    // console.log(error)

       throw new ApiError(500 , " Something went wrong while generating refresh and access token")
}}

const registerUser = asyncHandler( async (req, res) => {
  
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body;
   

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )



const loginUser  = asyncHandler(async (req, res) =>{

    // Steps to login 
    /**
     get data from frontend/user
     check validation(find user)
     check for password , email
     check whether the password matches or email matches or not
     access and refresh token
     send cookie
     */
  
     const {email , username , password} = req.body
     if(!(username || email)){
        throw new ApiError(400 , "usename or password is required")
     }
    
    const user = await User.findOne({
        $or : [{username} , {email}]
     })

     if(!user){
        throw new ApiError(404 , "User doesn't exist")
     }
        // password -> user wala password and this.password -> db wala matlab encrypted wala 

        const isPasswordValid = await user.isPasswordCorrect(password)
        
        if(!isPasswordValid){
        throw new ApiError(401 , "Password incorrect")
     }
const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

 const loggedInUser = await User.findById( user._id).select("-password -refreshToken")

 const options = {
    httpOnly : true,
    secure : false
 }

 return res
 .status(200)
 .cookie("accessToken" , accessToken , options)
 .cookie("refreshToken" , refreshToken , options)
 .json(
    new ApiResponse(200 , {user : loggedInUser , accessToken , refreshToken} , "User Loggedin successfully")
 )
    })

const logoutuser = asyncHandler(async(req,res) =>{
    User.findByIdAndUpdate(req.user._id,
        {
            $set :{
                refreshToken : undefined
            },

        },
        {
            new  : true

        }

    )
   const options = {
    httpOnly : true,
    secure : true
   }
   return res
   .status(200)
   .clearCookie("accessToken" , options)
   .clearCookie("refreshToken" , options)
   .json(new ApiResponse(200 , {} , "User logged out"))
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
if(!incomingRefreshToken){
    throw new ApiError(401 , "Unauthorised request")
}

try {
     const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id)
     if(!user){
        throw new ApiError(401 , "Invalid RefreshToken")
     }
    
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "refresh token is expired or used")
    }
    
    const options = {
        httpOnly : true,
        secure : true
    }
    const {accessToken  , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json( new ApiResponse(200 , {accessToken , refreshToken : newRefreshToken } , "Access token refreshed"))
   
} catch (error) {
    throw new ApiError(401 , error?.message || "Invalid refresh token")
}
 })

const changeCurrentPassword = asyncHandler(async(req , res) =>{
    const {oldPassword , newPassword} = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect =   user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
    throw new ApiError(400 , "Invalid old password")
  }
  user.password = newPassword
  await user.save({validateBeforeSave : false})
  return res.status(200)
  .json(new ApiResponse(200 , {} , "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200 , req.user , "Current User fetched Successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName , email} = req.body
   const user =  User.findByIdAndUpdate(
        req.user?._id,
    {
            $set :{
                fullName,
                email : email
            }
    },
    {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "User Updated Successfully"))
})

const updateUserAvtar = asyncHandler(async(req , res) =>{
    const avtarLocalPath = req.file?.path
    if(!avtarLocalPath){
        throw new ApiError(400 , "Avtar file is missing")
    }
    const avatar = await uploadOnCloudinary(avtarLocalPath)
    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on avtar")
    }
   const user =  await User.findByIdAndUpdate(
        req.user?._id
    ,
    {
        $set:{
            avatar : avatar.url
        }
    },
    {new  : true}
    ).select("-password")
     return res
    .status(200)
    .json(new ApiResponse(200 , user , "avtar updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async(req , res) =>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400 , "coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading the coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id
    ,
    {
        $set:{
           coverImage : coverImage.url
        }
    },
    {new  : true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200 , user , "coverImage updated Successfully"))
})

export  { registerUser,
          loginUser,
          logoutuser,
          refreshAccessToken,
          changeCurrentPassword,
          getCurrentUser,
          updateAccountDetails,
          updateUserAvtar,
          updateUserCoverImage,
 }