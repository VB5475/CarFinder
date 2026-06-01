const express = require("express");
const fs = require("fs");
const path = require("path");
const { recommendCars } = require("../utils/scorer");

const router = express.Router();
const carsPath = path.join(__dirname, "../data/cars.json");

let carsCache = null;

function loadCars() {
  if (!carsCache) {
    carsCache = JSON.parse(fs.readFileSync(carsPath, "utf8"));
  }
  return carsCache;
}

router.post("/", (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "answers object is required" });
    }

    const cars = loadCars();
    const results = recommendCars(answers, cars);
    res.json({ results });
  } catch (err) {
    console.error("POST /api/recommend:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

module.exports = router;
