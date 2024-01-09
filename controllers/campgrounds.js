const CampGround = require("../models/campground.js");
const { cloudinary } = require("../cloudinary/cloudindex.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding.js");
const mapbox_token = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapbox_token });

module.exports.index = async (req, res) => {
  const campgrounds = await CampGround.find({});

  res.render("campgrounds/index.ejs", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "you must be signed in");
    return res.redirect("/login");
  }
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res, next) => {
  const geodata = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();

  const campground = new CampGround(req.body.campground);
  campground.geometry = geodata.body.features[0].geometry;
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user._id;

  await campground.save();
  req.flash("success", "Campground Succesfully created");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await CampGround.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");

  if (!campground) {
    req.flash("error", "Can not find that campground!");
    return res.redirect("/campgrounds");
  }

  res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;

  const campground = await CampGround.findById(id);
  if (!campground) {
    req.flash("error", "Cannot find that campground");
    return redirect("/campgrounds");
  }

  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;

  const campground = await CampGround.findByIdAndUpdate(id, { ...req.body });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  campground.images.push(...imgs);

  await campground.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }

  req.flash("success", "Succesfully updated campground");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.destroyCampground = async (req, res) => {
  const { id } = req.params;

  const deleted = await CampGround.findByIdAndDelete(id);

  req.flash("success", "Succesfully Deleted Campground. Good Job Buddy");

  res.redirect("/campgrounds");
};
