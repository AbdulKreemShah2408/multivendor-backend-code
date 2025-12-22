// const mongoose = require("mongoose");

// const conncetDatabase = () => {
//   mongoose
//     .connect(process.env.DB_URL)
//     .then((data) => {
//       console.log("mongodb connected with the server");
//     })
//     .catch((err) => {
//       console.log("error while connecting the database  is ", err.message);
//       process.exit(1);
//     });
// };

// module.exports = conncetDatabase;
const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("✅ MongoDB connected successfully.");
    })
    .catch((err) => {
      console.error("❌ Error connecting to MongoDB:", err.message);
      process.exit(1); // Exit the process if DB connection fails
    });
};

module.exports = connectDatabase;
