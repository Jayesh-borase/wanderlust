const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path"); 
var methodOverride = require('method-override')
const ejsLayouts = require("express-ejs-layouts");



app.use(express.static(path.join(__dirname, "public")));
app.use(ejsLayouts);
app.set("layout", "layouts/boilerplate.ejs");
 

app.use(methodOverride('_method'))

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.urlencoded({extended:true}));

main()
.then((res) => console.log("db connect.."))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}
app.get("/listings",async (req,res) => {

  const allListings=await Listing.find();
  res.render("./listings/index.ejs",{allListings});
})

app.get("/listings/new",(req,res) => {
  res.render("./listings/new.ejs");
})

app.post("/listings",async (req,res) =>{
  const newListing=new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
})

app.get("/listings/:id/edit",async (req,res) => {
  const { id }=req.params;
  const listing=await Listing.findById(id);
 
  res.render("./listings/edit.ejs",{listing});
})
app.put("/listings/:id", async (req, res) => {
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
    res.redirect(`/listings/${id}`);
});

app.get("/listings/:id", async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing.image) {
        listing.image = { url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60" };
    } else if (typeof listing.image === "string") {
        listing.image = { url: listing.image };
    }

    res.render("listings/show", { listing });
});

app.delete("/listings/:id",async(req,res) =>{
  const { id }=req.params;
  const deleted=await Listing.findByIdAndDelete(id);
  
  res.redirect("/listings");
})

app.listen(8080,()=>{
    console.log("app listning on port 8080");
})
app.get("/",(req,res)=>{
    res.send("I am root");
})