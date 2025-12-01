const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/:id", (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ error: "Missing user id" });

  const sql = `SELECT ID, CompID, Name, Type FROM "User" WHERE ID = ? LIMIT 1`;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Select user error:", err);
      return res.status(500).json({ error: "Failed to load user" });
    }
    if (!row) return res.status(404).json({ error: "User not found" });
    return res.json({ user: row });
  });
});

module.exports = router;
