const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let parkingData = {
  total: 10,
  occupied: 0,
  vacant: 10
};

// ESP API (real)
app.post("/update", (req, res) => {
  console.log("🔥 ESP HIT RECEIVED");
  console.log("Incoming Data:", req.body);

  const occupied = req.body.occupied ?? 0;
  const vacant = req.body.vacant ?? (10 - occupied);

  parkingData.occupied = occupied;
  parkingData.vacant = vacant;

  console.log("Updated Parking Data:", parkingData);

  res.json({ status: "ok" });
});
// GET DATA
app.get("/data", (req, res) => {
  res.json(parkingData);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});