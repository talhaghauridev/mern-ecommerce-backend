const corsConfig = {
  origin: [process.env.FRONTEND_URL,"http://localhost:5173"],
  credentials: true,
};

const bodyParserConfig = {
  verify: (req, res, buf) => {
    req.rawBody = buf;
    console.log(buf);
  },
};

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}


module.exports =  { corsConfig,bodyParserConfig,cloudinaryConfig}