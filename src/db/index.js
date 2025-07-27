const mongoose = require("mongoose");
const { DB_NAME } = require("../constants");
const connectDB = async () => {
   try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`);
      console.log(`Mongodb connectd: ${connectionInstance.connection.host}`);
   } catch (error) {
      console.log(`Mongodb Error: ${error}`);
      process.exit(1);
   }
};

module.exports = connectDB;
