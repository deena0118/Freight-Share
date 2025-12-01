const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/", (req, res) => {
  const compId = (req.query.compId && String(req.query.compId).trim()) || "";
  if (!compId) return res.status(400).json({ error: "compId is required" });

  const bookingsSql = `
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
    WHERE s.CompID = ?
      AND lower(trim(b.Status)) = 'pending admin approval'
    ORDER BY datetime(b.CreatedAt) DESC
  `;

  const countsSql = `
    SELECT
      (SELECT COUNT(*)
         FROM Booking b
         JOIN Space s ON s.RefID = b.RefID
        WHERE s.CompID = ?
          AND lower(trim(b.Status)) = 'pending admin approval'
      ) AS bookingPendingAdminApproval,
      (SELECT COUNT(*)
         FROM Space s
        WHERE s.CompID = ?
          AND lower(trim(s.Status)) = 'pending admin approval'
      ) AS spacePendingAdminApproval
  `;

  db.serialize(() => {
    db.all(bookingsSql, [compId], (err, rows) => {
      if (err) {
        console.error("Select booking-requests error:", err);
        return res.status(500).json({ error: "Failed to load booking requests" });
      }

      const mapped = (rows || []).map((row) => {
        if (row.DepDate) {
          const dt = String(row.DepDate);
          const parts = dt.split(" ");
          row.DepDate = parts[0] || row.DepDate;
          row.DepTime = (parts[1] || "").slice(0, 5);
        } else {
          row.DepTime = "";
        }
        return row;
      });

      db.get(countsSql, [compId, compId], (err2, c) => {
        if (err2) {
          console.error("Select booking-requests counts error:", err2);
          return res.status(500).json({ error: "Failed to load request counts" });
        }

        const bookingCount = Number((c && c.bookingPendingAdminApproval) || 0);
        const spaceCount = Number((c && c.spacePendingAdminApproval) || 0);

        return res.json({
          bookings: mapped,
          counts: {
            bookingPendingAdminApproval: bookingCount,
            spacePendingAdminApproval: spaceCount,
            totalRequests: bookingCount + spaceCount
          }
        });
      });
    });
  });
});

module.exports = router;


/**
 * PUT /booking-requests/:bookId/status
 * - Approve => Status becomes "Pending"
 * - Reject  => Status becomes "Rejected"
 * Only Admin/SubAdmin of the SELLER company can do this.
 */
router.put("/:bookId/status", (req, res) => {
  const bookId = String(req.params.bookId || "").trim();
  const statusIn = (req.body && String(req.body.status || "").trim()) || "";
  const actorUserId = (req.body && String(req.body.actorUserId || "").trim()) || "";
  const actorCompId = (req.body && String(req.body.actorCompId || "").trim()) || "";

  if (!bookId) return res.status(400).json({ error: "Missing BookID" });
  if (!statusIn) return res.status(400).json({ error: "Missing status" });
  if (!actorUserId) return res.status(400).json({ error: "Missing actorUserId" });
  if (!actorCompId) return res.status(400).json({ error: "Missing actorCompId" });

  const n = statusIn.toLowerCase().trim();
  let newStatus = "";
  if (n === "pending") newStatus = "Pending"; // APPROVE
  else if (n === "rejected") newStatus = "Rejected";
  else return res.status(400).json({ error: "Invalid status. Use Pending|Rejected" });

  const bookingSql = `
    SELECT
      b.BookID,
      b.Status AS BookingStatus,
      s.CompID AS SpaceCompID
    FROM Booking b
    JOIN Space s ON s.RefID = b.RefID
    WHERE b.BookID = ?
    LIMIT 1
  `;

  const actorSql = `SELECT Type FROM "User" WHERE ID = ? LIMIT 1`;

  db.get(bookingSql, [bookId], (err, bk) => {
    if (err) {
      console.error("Select booking request error:", err);
      return res.status(500).json({ error: "Failed to load booking" });
    }
    if (!bk) return res.status(404).json({ error: "Booking not found" });

    const cur = String(bk.BookingStatus || "").toLowerCase().trim();
    if (cur !== "pending admin approval") {
      return res.status(400).json({ error: "Only Pending Admin Approval bookings can be updated here" });
    }

    db.get(actorSql, [actorUserId], (err2, au) => {
      if (err2) {
        console.error("Select actor error:", err2);
        return res.status(500).json({ error: "Failed to load user" });
      }
      if (!au) return res.status(404).json({ error: "User not found" });

      const actorType = String(au.Type || "").toLowerCase().trim();
      const isAdminOrSub = actorType === "admin" || actorType === "subadmin";

      const spaceCompId = String(bk.SpaceCompID || "");
      const allowed = isAdminOrSub && String(actorCompId) === spaceCompId;

      if (!allowed) return res.status(403).json({ error: "Not allowed" });

      db.run(`UPDATE Booking SET Status = ? WHERE BookID = ?`, [newStatus, bookId], function (uErr) {
        if (uErr) {
          console.error("Update booking request error:", uErr);
          return res.status(500).json({ error: "Failed to update booking" });
        }
        return res.json({ ok: true, BookID: bookId, Status: newStatus });
      });
    });
  });
});

module.exports = router;
