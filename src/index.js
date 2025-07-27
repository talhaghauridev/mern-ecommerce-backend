const app = require("./app");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary");
const connectDB = require("./db/index");
const { cloudinaryConfig } = require("./config");
const PORT = process.env.PORT || 5000;
//Confing

dotenv.config({ path: "./.env" });

// Connecting to Database

let server;
connectDB().then(() => {
   server = app.listen(PORT, () => {
      console.log(`Server is working is http://localhost:${PORT}`);
   });
});

app.get("/", (req, res, next) => {
   res.json({
      success: true,
      message: "Server is running"
   });
});

cloudinary.config(cloudinaryConfig);

process.on("unhandledRejection", (err) => {
   console.log(`Error ${err.message}`);
   console.log(`Sutting down the server due to Unhandel Promise Rejection`);
   server.close(() => {
      process.exit(1);
   });
});

module.exports = app;
