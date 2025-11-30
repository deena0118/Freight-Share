const express = require("express");
const router = express.Router();
const db = require("../db/database");

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
      s.Origin,
      s.Destination,
      s.Type,
      s.DepDate,
      s.EmptySpaceW,
      s.UnitW,
      s.EmptySpaceA,
      s.UnitA,
      s.Status AS SpaceStatus,
      s.CompID,
      c.CompName
    FROM Booking b
    JOIN Space s ON s.RefID = b.RefID
    LEFT JOIN "Company" c ON c.CompID = s.CompID
  `;

  function run(whereClause, params) {
    let sql = baseSql;
    if (whereClause && whereClause.trim().length > 0) {
      sql += " WHERE " + whereClause;
    }
    sql += " ORDER BY datetime(b.CreatedAt) DESC";

    db.all(sql, params || [], (err, rows) => {
      if (err) {
        console.error("Select bookings error:", err);
        return res.status(500).json({ error: "Failed to load bookings" });
      }
      return res.json({ bookings: rows });
    });
  }

  if (scope === "all") {
    return run("", []);
  }

  if (!userId) {
    return res.status(400).json({ error: "userId is required for this scope" });
  }

  if (scope === "buyer") {
    return run("b.ID = ?", [userId]);
  }

  if (scope === "seller") {
    db.get('SELECT CompID FROM "User" WHERE ID = ?', [userId], (err, row) => {
      if (err) {
        console.error("Lookup seller CompID error:", err);
        return res.status(500).json({ error: "Failed to load bookings" });
      }
      if (!row || !row.CompID) {
        return res.status(404).json({ error: "User not found / missing CompID" });
      }
      return run("s.CompID = ?", [row.CompID]);
    });
    return;
  }

  return res.status(400).json({ error: "Invalid scope. Use scope=all|buyer|seller" });
});

router.post("/", (req, res) => {
  const {
    BookID,
    RefID,
    ID,
    Status,
    SpacePrice,
    BidPrice,
    Partial,
    PartialAmt,
    CreatedAt
  } = req.body || {};

  if (!BookID || !RefID || !ID) {
    return res.status(400).json({ error: "Missing BookID, RefID or ID" });
  }

  const sql = `
    INSERT INTO Booking
      (BookID, RefID, ID, Status, SpacePrice, BidPrice, Partial, PartialAmt, CreatedAt)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    BookID,
    RefID,
    ID,
    Status || "Pending",
    SpacePrice || "0",
    BidPrice || "0",
    Partial || "N",
    PartialAmt || "0",
    CreatedAt || new Date().toISOString()
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Insert Booking error:", err);
      return res.status(500).json({ error: "Failed to create booking" });
    }

    return res.json({
      ok: true,
      BookID,
      rowsAffected: this.changes
    });
  });
});

module.exports = router;
