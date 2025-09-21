const express = require("express");
const app = express();
const router = express.Router();
const Listing = require("../models/listing.js");
const { listingSchema } = require("../schema.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpresError.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const { storage } = require("../cloudConfig.js");
const multer = require("multer");
const upload = multer({ storage });

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errmsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errmsg);
  } else {
    next();
  }
};router.get('/', async (req, res) => {
  try {
    const { location } = req.query; // single input
    let query = {};

    if (location) {
      query = {
        $or: [
          { location: { $regex: location, $options: 'i' } },
          { country: { $regex: location, $options: 'i' } }
        ]
      };
    }

    const allListings = await Listing.find(query);
    res.render('listings/index', { allListings, currentUser: req.user });
  } catch (err) {
    console.log(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/');
  }
});

router.get("/new", isLoggedIn, (req, res) => {
  res.render("./listings/new.ejs");
});
router.post(
  "/",
  isLoggedIn,
  upload.single("listing[image]"),
  wrapAsync(async (req, res) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
      throw new ExpressError(400, error.details.map(el => el.message).join(","));
    }

    const newListing = new Listing(req.body.listing);

    // handle file upload (fallback if no file provided)
    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    } else {
      // default image
      newListing.image = {
        url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60",
        filename: "default.jpg",
      };
    }
    newListing.owner = req.user._id;
    await newListing.save();

    req.flash("success", "New Listing Created Successfully!");
    res.redirect("/listings");
  })
);

router.get("/:id/edit", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(res.locals.currentUser._id)) {
    req.flash("error", "You are not the owner of the listing");
    return res.redirect(`/listings/${id}`);
  }

  res.render("./listings/edit.ejs", { listing });
});

router.put("/:id", isLoggedIn, upload.single("listing[image]"), async (req, res) => {
  const { id } = req.params;
  const listingData = req.body.listing;

  const updatedListing = await Listing.findByIdAndUpdate(id, listingData, { new: true });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    updatedListing.image = { url, filename };
    await updatedListing.save();
  }

  req.flash("success", "Listing Edited Successfully!");
  res.redirect(`/listings/${id}`);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  if (!listing.image) {
    listing.image = {
      url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60",
    };
  } else if (typeof listing.image === "string") {
    listing.image = { url: listing.image };
  }

  res.render("listings/show", { listing });
});

router.delete("/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(res.locals.currentUser._id)) {
    req.flash("error", "You are not the owner of the listing");
    return res.redirect(`/listings/${id}`);
  }
  const deleted = await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing Deleted Successfully!");
  res.redirect("/listings");
});

module.exports = router;
