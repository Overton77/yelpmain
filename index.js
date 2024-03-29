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

const campgroundRoutes = require("./routes/campground.js");
const userRoutes = require("./routes/users.js");

const reviewRoutes = require("./routes/reviews.js");

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/yelp-camp";

mongoose.connect(dbUrl, { 
  dbName: 'test'
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("DATABASE CONNECTED");
});

const app = express();


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

const secret = process.env.SECRET || "thishouldbeabettersecret";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: secret,
  },
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store,
  name: "session",
  secret: secret,
  resave: false,
  saveUninitialized: true,

  cookie: {
    httpOnly: true,

    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(flash());

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
          "https://res.cloudinary.com",
          "https://images.unsplash.com/",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
        ],
      },
    },
  })
);

app.use(passport.initialize());

app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;

  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { message = "Something Went Wrong", statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Express server listening on ${PORT}`);
});
