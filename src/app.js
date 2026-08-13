import express from "express";
import cors from "cors";
import morgan from "morgan";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import notFoundHandler from "./middleware/notFoundHandler.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Autopia API is running",
  });
});

app.use("/api/vehicles", vehicleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
