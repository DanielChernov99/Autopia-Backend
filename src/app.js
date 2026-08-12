import express from "express";
import cors from "cors";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Autopia API is running",
  });
});

app.use("/api/vehicles", vehicleRoutes);

app.use(errorHandler);

export default app;
