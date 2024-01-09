const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync.js");
const multer = require("multer");
const { storage } = require("../cloudinary/cloudindex.js");
const upload = multer({ storage });

const {
  isLoggedIn,
  isAuthor,
  validateCampground,
} = require("../middleware.js");

const campgrounds = require("../controllers/campgrounds.js");

router.route("/").get(catchAsync(campgrounds.index)).post(
  isLoggedIn,
  upload.array("image"),
  validateCampground,

  catchAsync(campgrounds.createCampground)
);
router.route("/new").get(isLoggedIn, campgrounds.renderNewForm);

router
  .route("/:id")
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.destroyCampground));

router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
