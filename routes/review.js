const express=require("express");
const app=express();
const router=express.Router({mergeParams:true});
const Review=require("../models/review.js");
const {reviewSchema}=require("../schema.js");
const wrapAsync=require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpresError.js");
const Listing=require("../models/listing.js");
const {isLoggedIn}=require("../middleware.js");

const validateReview=(req,res,next)=>{
  let{error}=reviewSchema.validate(req.body);
  if(error)
  {
    let errmsg=error.details.map((el) => el.message).join(",");
    throw new ExpressError(400,errmsg);
  }else{
    next();
  }
}

router.post("/",validateReview,isLoggedIn,async(req,res) =>{
  const {id}=req.params;
  const listing=await Listing.findById(id);
  const newReview=new Review(req.body.review);
  newReview.author=req.user._id;
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "Review Added Successfully!");
  res.redirect(`/listings/${id}`);
})

router.delete("/:reviewId",isLoggedIn,async (req,res) => {
const {id,reviewId}=req.params;
const review=await Review.findById(reviewId);
  if(!review.author.equals(req.user._id))
  {
    req.flash("error","You are not the author");
    return res.redirect(`/listings/${id}`);
  }
  await Listing.findByIdAndUpdate(id,{$pull : {reviews : reviewId}});
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review Deleted Successfully!");  
  res.redirect(`/listings/${id}`);

})


module.exports=router;