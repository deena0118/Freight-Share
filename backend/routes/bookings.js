const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/", (req, res) => {
  const scope = String(req.query.scope || "all").toLowerCase();
  const userId = (req.query.userId && String(req.query.userId).trim()) || "";
  const compId = (req.query.compId && String(req.query.compId).trim()) || "";

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
    LEFT JOIN "User" u ON u.ID = b.ID
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

      const mappedRows = (rows || []).map((row) => {
        if (row.DepDate) {
          const dt = String(row.DepDate);
          const [datePart, timePart] = dt.split(" ");
          row.DepDate = datePart || "";
          row.DepTime = (timePart || "").slice(0, 5);
        } else {
          row.DepTime = "";
        }
        return row;
      });

      return res.json({ bookings: mappedRows });
    });
  }

  // --- ALL BOOKINGS FOR THIS COMPANY ---
  if (scope === "all") {
    if (!compId) {
      return res
        .status(400)
        .json({ error: "compId is required for scope=all" });
    }

    // All bookings where either:
    // - the booked space belongs to this company (s.CompID)
    // OR
    // - the buyer user belongs to this company (u.CompID)
    return run("(s.CompID = ? OR u.CompID = ?)", [compId, compId]);
  }

  // For buyer / seller, we need userId
  if (!userId) {
    return res.status(400).json({ error: "userId is required for this scope" });
  }

  if (!compId) {
    return res
      .status(400)
      .json({ error: "compId is required for this scope" });
  }

  if (scope === "buyer") {
    return run("b.ID = ? AND u.CompID = ?", [userId, compId]);
  }

  if (scope === "seller") {
    return run("s.CompID = ?", [compId]);
  }

  return res
    .status(400)
    .json({ error: "Invalid scope. Use scope=all|buyer|seller" });
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
    CreatedAt,
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
    CreatedAt || new Date().toISOString(),
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Insert Booking error:", err);
      return res.status(500).json({ error: "Failed to create booking" });
    }

    return res.json({
      ok: true,
      BookID,
      rowsAffected: this.changes,
    });
  });
});

module.exports = router;
