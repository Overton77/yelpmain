const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync.js");
const passport = require("passport");
const { storeReturnTo } = require("../middleware.js");
const users = require("../controllers/auth.js");

// isAuthenticated added to the request object itself from passport

// Once a user registers they should be immediately logged in

router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.register));

router
  .route("/login")
  .get(users.renderLogin)
  .post(
    storeReturnTo,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login
  );

// use passport.authenticate('thestrategyname, {(options) {failureFLash: failureRedirect: }})

router.get("/logout", users.logout);

module.exports = router;
