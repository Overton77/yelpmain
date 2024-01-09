const mongoose = require("mongoose");
const cities = require("./cities.js");
const { places, descriptors } = require("./seedHelper.js");

const CampGround = require("../models/campground.js");
mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("DATABASE CONNECTED");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seeddb = async () => {
  await CampGround.deleteMany({});

  for (let i = 0; i < 200; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new CampGround({
      author: "65933e8e54596d8e0b8b1314",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)},${sample(places)}`,
      description: "Lorem ipson letters that look description for campground",
      price,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: "https://res.cloudinary.com/de398fjre/image/upload/v1704405399/YelpCamp/j06tvimlp8bbt95ksrqj.jpg",
          filename: "YelpCamp/j06tvimlp8bbt95ksrqj",
        },
        {
          url: "https://res.cloudinary.com/de398fjre/image/upload/v1704405399/YelpCamp/moc1y7gzwp7nvyxzeuzt.jpg",
          filename: "YelpCamp/moc1y7gzwp7nvyxzeuzt",
        },
      ],
    });
    await camp.save();
  }
};

seeddb().then(() => {
  mongoose.connection.close();
});
