if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path"); 
const Listing = require("./models/listing.js");
const methodOverride = require('method-override');
const ejsLayouts = require("express-ejs-layouts");
const ExpressError = require("./utils/ExpresError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const users = require("./routes/user.js");

app.use(express.static(path.join(__dirname, "public")));
app.use(ejsLayouts);
app.set("layout", "layouts/boilerplate.ejs");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


 const dburl=process.env.ATLASDB_URL;
 async function main(){
  await mongoose.connect(dburl);
 }
 main().catch(err => console.log("DB Connection Error:", err));

 const store=MongoStore.create({
  mongoUrl:dburl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter: 24 * 3600,
 });

 store.on("error",(err) => {
  console.log("Error in mongo session",err);
 })
const sessionOptions = {
  store,
  secret: process.env.SECRET ,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true, // prevents client-side JS from accessing the cookie
    expires: Date.now() + 1000*60*60*24*7, // 1 week
    maxAge: 1000*60*60*24*7
  }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser=req.user;
  next();
});


passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/", users);

 

app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use(async (err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;

  if (req.xhr) {
    return res.status(statusCode).json({ error: message });
  }

  let allListings = [];
  try {
    allListings = await Listing.find();
  } catch (dbErr) {
    console.log("DB fetch failed in error handler:", dbErr);
  }

  res.status(statusCode).render("listings/index", { allListings, error: message });
});

app.listen(8080, () => {
  console.log("App listening on port 8080");
});
