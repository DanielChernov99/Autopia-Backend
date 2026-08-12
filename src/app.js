import express from "express";
import cors from "cors";
import vehicleRoutes from "./routes/vehicleRoutes.js";

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

export default app;
