const express=require("express");
const app=express();
const mongoose=require("mongoose");


main()
.then((res) => console.log("db connect.."))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');

  
}
app.listen(8080,()=>{
    console.log("app listning on port 8080");
})
app.get("/",(req,res)=>{
    res.send("I am root");
})