const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/", (req, res) => {
  const sql = `
    SELECT
      PortID,
      Name,
      LOCATION AS Location,
      Country
    FROM Port
    ORDER BY Location ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Select ports error:", err);
      return res.status(500).json({ error: "Failed to load ports" });
    }
    return res.json({ ports: rows });
  });
});

module.exports = router;
