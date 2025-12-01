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
      s.Restriction,
      s.Status AS SpaceStatus,

      s.CompID AS SpaceCompID,
      s.UserID AS SpaceUserID,
      sc.CompName AS SpaceCompName,
      COALESCE(sc.CompDesc, '') AS SpaceCompDesc,

      u.CompID AS BuyerCompID,
      bc.CompName AS BuyerCompName,
      COALESCE(bc.CompDesc, '') AS BuyerCompDesc,

      s.CompID AS CompID,
      sc.CompName AS CompName
    FROM Booking b
    JOIN Space s ON s.RefID = b.RefID
    LEFT JOIN "User" u ON u.ID = b.ID
    LEFT JOIN "Company" sc ON sc.CompID = s.CompID
    LEFT JOIN "Company" bc ON bc.CompID = u.CompID
  `;

  function run(whereClause, params) {
    let sql = baseSql;
    if (whereClause && whereClause.trim()) sql += " WHERE " + whereClause;
    sql += " ORDER BY datetime(b.CreatedAt) DESC";

    db.all(sql, params || [], (err, rows) => {
      if (err) {
        console.error("Select bookings error:", err);
        return res.status(500).json({ error: "Failed to load bookings" });
      }

      const mappedRows = (rows || []).map((row) => {
        if (row.DepDate) {
          const dt = String(row.DepDate);
          const parts = dt.split(" ");
          row.DepDate = parts[0] || "";
          row.DepTime = (parts[1] || "").slice(0, 5);
        } else {
          row.DepTime = "";
        }
        return row;
      });

      return res.json({ bookings: mappedRows });
    });
  }

  if (scope === "all") {
    if (!compId) return res.status(400).json({ error: "compId is required for scope=all" });
    return run("(s.CompID = ? OR u.CompID = ?)", [compId, compId]);
  }

  if (!userId) return res.status(400).json({ error: "userId is required for this scope" });
  if (!compId) return res.status(400).json({ error: "compId is required for this scope" });

  if (scope === "buyer") return run("b.ID = ?", [userId]);
  if (scope === "seller") return run("s.CompID = ?", [compId]);

  return res.status(400).json({ error: "Invalid scope. Use scope=all|buyer|seller" });
});

router.put("/:bookId/status", (req, res) => {
  const bookId = String(req.params.bookId || "").trim();
  const statusIn = (req.body && String(req.body.status || "").trim()) || "";
  const actorUserId = (req.body && String(req.body.actorUserId || "").trim()) || "";
  const actorCompId = (req.body && String(req.body.actorCompId || "").trim()) || "";

  if (!bookId) return res.status(400).json({ error: "Missing BookID" });
  if (!statusIn) return res.status(400).json({ error: "Missing status" });
  if (!actorUserId) return res.status(400).json({ error: "Missing actorUserId" });
  if (!actorCompId) return res.status(400).json({ error: "Missing actorCompId" });

  const n = statusIn.toLowerCase();
  let newStatus = "";
  if (n === "canceled" || n === "cancelled") newStatus = "Canceled";
  else if (n === "confirmed") newStatus = "Confirmed";
  else if (n === "rejected") newStatus = "Rejected";
  else return res.status(400).json({ error: "Invalid status" });

  const bookingSql = `
    SELECT
      b.BookID,
      b.Status AS BookingStatus,
      b.RefID,
      b.ID AS BuyerID,
      u.CompID AS BuyerCompID,
      s.CompID AS SpaceCompID,
      s.UserID AS SpaceUserID
    FROM Booking b
    JOIN Space s ON s.RefID = b.RefID
    LEFT JOIN "User" u ON u.ID = b.ID
    WHERE b.BookID = ?
    LIMIT 1
  `;

  const actorSql = `SELECT Type FROM "User" WHERE ID = ? LIMIT 1`;

  db.get(bookingSql, [bookId], (err, bk) => {
    if (err) {
      console.error("Select booking error:", err);
      return res.status(500).json({ error: "Failed to load booking" });
    }
    if (!bk) return res.status(404).json({ error: "Booking not found" });

    const cur = String(bk.BookingStatus || "").toLowerCase().trim();
    if (cur !== "pending") return res.status(400).json({ error: "Only pending bookings can be updated" });

    db.get(actorSql, [actorUserId], (err2, au) => {
      if (err2) {
        console.error("Select actor error:", err2);
        return res.status(500).json({ error: "Failed to load user" });
      }
      if (!au) return res.status(404).json({ error: "User not found" });

      const actorType = String(au.Type || "").toLowerCase().trim();
      const isAdminOrSub = actorType === "admin" || actorType === "subadmin";

      const buyerId = String(bk.BuyerID || "");
      const buyerCompId = String(bk.BuyerCompID || "");
      const spaceCompId = String(bk.SpaceCompID || "");
      const spaceUserId = String(bk.SpaceUserID || "");

      let allowed = false;

      if (newStatus === "Canceled") {
        allowed = (isAdminOrSub && actorCompId === buyerCompId) || actorUserId === buyerId;
      } else {
        allowed = (isAdminOrSub && actorCompId === spaceCompId) || actorUserId === spaceUserId;
      }

      if (!allowed) return res.status(403).json({ error: "Not allowed" });

      const refId = bk.RefID;

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(`UPDATE Booking SET Status = ? WHERE BookID = ?`, [newStatus, bookId], function (uErr) {
          if (uErr) {
            db.run("ROLLBACK");
            console.error("Update booking error:", uErr);
            return res.status(500).json({ error: "Failed to update booking" });
          }

          if (newStatus !== "Confirmed") {
            db.run("COMMIT");
            return res.json({ ok: true, BookID: bookId, Status: newStatus });
          }

          db.run(`UPDATE Space SET Status = 'Unavailable' WHERE RefID = ?`, [refId], function (sErr) {
            if (sErr) {
              db.run("ROLLBACK");
              console.error("Update space error:", sErr);
              return res.status(500).json({ error: "Failed to update space status" });
            }

            db.run("COMMIT");
            return res.json({ ok: true, BookID: bookId, Status: newStatus, SpaceStatus: "Unavailable" });
          });
        });
      });
    });
  });
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

    return res.json({ ok: true, BookID, rowsAffected: this.changes });
  });
});

module.exports = router;
