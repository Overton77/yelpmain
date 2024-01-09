if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

// How would you impose limits on the amount of images that can be uploaded

// HTML forms by default are url encoded we have to change it to MIME

const campgroundRoutes = require("./routes/campground.js");
const userRoutes = require("./routes/users.js");

const reviewRoutes = require("./routes/reviews.js");

// const dbUrl = process.env.DB_URL;

const dbUrl = "mongodb://127.0.0.1:27017/yelp-camp";
//"mongodb://127.0.0.1:27017/yelp-camp"

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("DATABASE CONNECTED");
});

const app = express();
const Port = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));
app.use(
  mongoSanitize({
    replaceWith: "-",
  })
);

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: "thisshouldbeabettersecret",
  },
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store,
  name: "yelpsession",
  secret: "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,

  cookie: {
    httpOnly: true,
    // secure: true, this means this cookie will only work over https and localhost is not
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(flash());

// Restricting the locations from which we can fetch resources

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://api.mapbox.com/",
          "https://a.tiles.mapbox.com/",
          "https://b.tiles.mapbox.com/",
          "https://events.mapbox.com/",
        ],
        scriptSrc: [
          "'unsafe-inline'",
          "'self'",
          "https://stackpath.bootstrapcdn.com/",
          "https://api.tiles.mapbox.com/",
          "https://api.mapbox.com/",
          "https://kit.fontawesome.com/",
          "https://cdnjs.cloudflare.com/",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://kit-free.fontawesome.com/",
          "https://stackpath.bootstrapcdn.com/",
          "https://api.mapbox.com/",
          "https://api.tiles.mapbox.com/",
          "https://fonts.googleapis.com/",
          "https://use.fontawesome.com/",
          "https://cdn.jsdelivr.net",
        ],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "blob:",
          "data:",
          "https://res.cloudinary.com", // Adjust to match your Cloudinary account
          "https://images.unsplash.com/",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com", // For Google Fonts
          "https://cdn.jsdelivr.net", // For fonts from jsDelivr
        ],
      },
    },
  })
);

app.use(passport.initialize());
// initialize passport
app.use(passport.session());
// intialize passport session
passport.use(new localStrategy(User.authenticate()));
// declare and initialize strategy passing in the authenticate method attached to pass port local mongoose
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.get("/fakeUser", async (req, res) => {
//   const user = new User({
//     email: "Johnoverton@apple.com",
//     username: "JohnyBoy",
//   });
//   const registeredUser = await User.register(user, "soccer");
//   res.send(registeredUser);

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  // You have access to all of the request session objects and variables in all your templates
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
// });

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// async function updateCampPrice() {
//   const campgrounds = await campground.find({});
//   for (let campground of campgrounds) {
//     campground.price = Number(campground.price);
//     await campground.save();
//   }
// }

// updateCampPrice().then(() => {
//   console.log("Migration Completed");
// });

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { message = "Something Went Wrong", statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(Port, () => {
  console.log(`Express server listening on ${Port}`);
});
