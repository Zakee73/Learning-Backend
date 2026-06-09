import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { loginUser, logoutuser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register" , (req, res, next) => {
    console.log("Route reached");
    next();
  },).post(upload.fields([
    {
        name : "avatar",
        maxCount  : 1
    },
    {
        name : "coverImage",
        maxCount : 1
    }
]),registerUser)
router.route("/login").post(loginUser)
 
// SECURED ROUTES
router.route("/logout").post(verifyJWT , logoutuser)
router.route("/refrsh-token").post(refreshAccessToken)
export default router