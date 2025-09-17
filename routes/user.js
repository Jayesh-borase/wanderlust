const express=require("express");
const app=express();
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport=require("passport");

router.get("/signup",(req,res) =>{
    res.render("./users/signup.ejs"); 
});

router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body.user;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.flash("success", "account created Successfully");
        res.redirect("/login");
    } catch (e) {
        console.log("Signup error:", e); 
        const errorMessage = e.message || "Something went wrong!";
        req.flash("error", errorMessage);
        res.redirect("/signup");
    }
});

router.get("/login",(req,res)=>{
    res.render("./users/login.ejs");
})

router.post("/login",
    passport.authenticate("local", {
        failureRedirect:"/login",
        failureFlash:true,
    }),
   async (req,res)=>{
    req.flash("success","Welcome back to wanderlust");
    res.redirect("/listings");
    
})
module.exports=router;
