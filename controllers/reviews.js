const Review = require("../models/review.js");
const CampGround = require("../models/campground.js");

module.exports.createReview = async (req, res) => {
  const campground = await CampGround.findById(req.params.id);
  const review = new Review(req.body.review);
  review.author = req.user._id;
  // in the form review[body] now all of the incoming req.body will be under the name review
  campground.reviews.push(review);
  await review.save();
  await campground.save();
  req.flash("success", "Created New Review");
  // Theres a way to await both of these at once concurrently

  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await CampGround.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Succesfully deleted review. Good Job Buddy");
  res.redirect(`/campgrounds/${id}`);
};
