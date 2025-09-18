const express=require("express");
const app=express();
const router=express.Router();
const Listing=require("../models/listing.js");
const {listingSchema}=require("../schema.js");
const wrapAsync=require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpresError.js");
const { isLoggedIn } = require("../middleware.js");



const validateListing=(req,res,next)=>{
  let{error}=listingSchema.validate(req.body);
  if(error)
  {
    let errmsg=error.details.map((el) => el.message).join(",");
    throw new ExpressError(400,errmsg);
  }else{
    next();
  }
}


router.get("/",async (req,res) => {

  const allListings=await Listing.find();
  res.render("./listings/index.ejs",{allListings});
})

router.get("/new",isLoggedIn,(req,res) => {
  
  res.render("./listings/new.ejs");
})

router.post("/",validateListing,async (req,res) =>{
  let result=listingSchema.validate(req.body);
  if(result.error)
  {
    throw new ExpressError(400,result.error);
  }
  const newListing=new Listing(req.body.listing);
  await newListing.save();
  req.flash("success", "New Listing Created Successfully!");
  res.redirect("/listings");
})

router.get("/:id/edit",async (req,res) => {
  const { id }=req.params;
  const listing=await Listing.findById(id);
 
  res.render("./listings/edit.ejs",{listing});
})
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const listingData = req.body.listing;

    const existingListing = await Listing.findById(id);

    if (!listingData.image || listingData.image.trim() === "") {
        listingData.image = existingListing.image;
    } else {
        listingData.image = {
            filename: "listingimage", 
            url: listingData.image
        };
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, listingData, { new: true });
    req.flash("success", "Listing Edited Successfully!");
    res.redirect(`/listings/${id}`);
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    
    if (!listing.image) {
        listing.image = { url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60" };
    } else if (typeof listing.image === "string") {
        listing.image = { url: listing.image };
    }
    
    res.render("listings/show", { listing });
});

router.delete("/:id",async(req,res) =>{
  const { id }=req.params;
  const deleted=await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted Successfully!");
  res.redirect("/listings");
});
module.exports=router;