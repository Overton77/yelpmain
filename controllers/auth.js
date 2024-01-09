const User = require("../models/user.js");

module.exports.renderRegister = (req, res) => {
  res.render("users/register.ejs");
};

module.exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({ email, username });
    const registereduser = await User.register(user, password);

    req.login(registereduser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome To Yelp Camp");
      res.redirect("/campgrounds");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("register");
  }
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
  req.flash("success", "welcome back");
  const redirectUrl = res.locals.returnTo || "/campgrounds";
  res.redirect(`${redirectUrl}`);
};

module.exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "Goodbye");
    res.redirect("/campgrounds");
  });
};
