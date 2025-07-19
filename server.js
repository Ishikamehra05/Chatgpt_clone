const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const colors = require("colors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorMiddleware");

//routes path
const authRoutes = require("./routes/authRoutes");

//dotenv
dotenv.config();

//mongo connection
connectDB();

//rest object
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

const PORT = process.env.PORT || 8080;

//API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/openai", require("./routes/openaiRoutes"));
app.use("/api/v1/test", require("./routes/testRoutes"));

// Error handler middleware (must be last)
app.use(errorHandler);

//listen server
app.listen(PORT, () => {
  console.log(
    `🚀 Server Running in ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
  console.log(`📡 API available at: http://localhost:${PORT}`.bgGreen.white);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/v1/test/health`.bgBlue.white);
});