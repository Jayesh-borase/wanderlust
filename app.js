const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path"); 

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
  res.render("/listings/new.ejs");
})


app.get("/listings/:id",async (req,res) => {
  const { id }= req.params;
  const listing=await Listing.findById(id);
  res.render("./listings/show.ejs",{listing});
})

app.listen(8080,()=>{
    console.log("app listning on port 8080");
})
app.get("/",(req,res)=>{
    res.send("I am root");
})