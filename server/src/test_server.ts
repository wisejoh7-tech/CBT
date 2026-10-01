import express from "express";
const app = express();
const PORT = Number(process.env.PORT) || 10000;
app.get("/", (req, res) => res.send("OK"));
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
