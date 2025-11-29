// backend/routes/bookings.js
const express = require("express");
const router = express.Router();
const db = require("../db/database");

// GET /bookings?scope=all|buyer|seller&userId=...
router.get("/", (req, res) => {
  const scope = String(req.query.scope || "all").toLowerCase();
  const userId = (req.query.userId && String(req.query.userId).trim()) || "";

  const baseSql = `
    SELECT
      b.BookID,
      b.RefID,
      b.ID AS BuyerID,
      b.Status,
      b.SpacePrice,
      b.BidPrice,
      b.Partial,
      b.PartialAmt,
      b.CreatedAt,

      s.Type,
      s.Origin AS Origin,
      s.Destination AS Destination,
      s.DepDate AS DepDate,
      s.DepTime AS DepTime,
      s.EmptySpaceW,
      s.UnitW,
      s.EmptySpaceA,
      s.UnitA,

      c.CompName,
      c.CompDesc,

      u.Name AS BuyerName
    FROM Booking b
    LEFT JOIN Space s ON s.RefID = CAST(b.RefID AS INTEGER)
    LEFT JOIN Company c ON c.CompID = s.CompID
    LEFT JOIN "User" u ON u.ID = b.ID
  `;

  function run(whereSql, params) {
    const sql = `
      ${baseSql}
      ${whereSql ? "WHERE " + whereSql : ""}
      ORDER BY b.CreatedAt DESC
    `;

    db.all(sql, params || [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ ok: true, bookings: rows || [] });
    });
  }

  if (scope === "all") return run("", []);

  if ((scope === "buyer" || scope === "seller") && !userId) {
    return res.status(400).json({ error: "userId is required for scope=buyer or scope=seller" });
  }

  if (scope === "buyer") return run("b.ID = ?", [userId]);

  if (scope === "seller") {
    db.get(`SELECT CompID FROM "User" WHERE ID = ?`, [userId], (e1, row) => {
      if (e1) return res.status(500).json({ error: e1.message });
      if (!row || !row.CompID) return res.status(404).json({ error: "User not found / missing CompID" });
      return run("s.CompID = ?", [row.CompID]);
    });
    return;
  }

  return res.status(400).json({ error: "Invalid scope. Use scope=all|buyer|seller" });
});

module.exports = router;
