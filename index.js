const app = require("./src/app");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary");
const connectDB = require("./src/db/index");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 5000;
//Confing

dotenv.config({ path: "./.env" });
app.use(bodyParser.json());
// Connecting to Database

let server;
connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`Server is working is http://localhost:${PORT}`);
  });
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Sutting down the server due to Unhandel Promise Rejection`);
  server.close(() => {
    process.exit(1);
  });
});
