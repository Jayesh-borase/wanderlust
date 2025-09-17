const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path"); 
const Listing = require("./models/listing.js");
const methodOverride = require('method-override');
const ejsLayouts = require("express-ejs-layouts");
const ExpressError = require("./utils/ExpresError.js");
const session = require("express-session");
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


const sessionOptions = {
  secret: "Mysupersecretcode",
  resave: false,
  saveUninitialized: true
};
app.use(session(sessionOptions));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/", users);

app.get("/", (req, res) => {
  res.send("I am root");
});


main()
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

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
