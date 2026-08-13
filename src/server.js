import app from "./app.js";
import connectDB from "./db/connection.js";

const PORT = process.env.PORT || 3000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Autopia API is running at http://localhost:${PORT}`);
});
