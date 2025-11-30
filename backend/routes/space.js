const express = require("express");
const db = require("../db/database");

const router = express.Router();

router.post("/list", (req, res) => {
    const {
        CompID,
        UserID,
        Type,
        Origin,
        Destination,
        DepDate,   // still received separately from the front-end
        DepTime,   // still received separately from the front-end
        EmptySpaceW,
        UnitW,
        EmptySpaceA,
        UnitA,
        Restriction,
        PriceType,
        Price
    } = req.body;

    // Basic presence validation
    if (
        !CompID ||
        !UserID ||
        !Type ||
        !Origin ||
        !Destination ||
        !DepDate ||
        !DepTime ||
        !EmptySpaceW ||
        !UnitW ||
        !EmptySpaceA ||
        !UnitA ||
        !PriceType
    ) {
        return res
            .status(400)
            .json({ error: "Missing required listing fields in the request body." });
    }

    // Combine DepDate + DepTime into a single datetime string to save in the DepDate column
    // Result format: "YYYY-MM-DD HH:MM"
    const combinedDepDate = `${DepDate} ${DepTime}`;

    const emptySpaceNumW = parseFloat(EmptySpaceW);
    const emptySpaceNumA = parseFloat(EmptySpaceA);

    if (isNaN(emptySpaceNumW) || emptySpaceNumW <= 0) {
        return res
            .status(400)
            .json({ error: "Weight empty space must be a positive number." });
    }

    if (isNaN(emptySpaceNumA) || emptySpaceNumA <= 0) {
        return res
            .status(400)
            .json({ error: "Area empty space must be a positive number." });
    }

    let finalPrice = null;
    if (PriceType === "fixed") {
        const parsedPrice = parseFloat(Price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res
                .status(400)
                .json({ error: "A valid positive price is required for fixed pricing." });
        }
        finalPrice = parsedPrice;
    } else if (PriceType === "bids") {
        finalPrice = null;
    } else {
        return res
            .status(400)
            .json({ error: "PriceType must be either 'fixed' or 'bids'." });
    }

    const userSql = `SELECT Type FROM User WHERE ID = ?`;
    db.get(userSql, [UserID], (err, row) => {
        if (err) {
            console.error("--- DB ERROR (SELECT Type FROM User) ---", err);
            return res.status(500).json({
                error: "Failed to check user type due to a database error."
            });
        }

        if (!row) {
            return res.status(400).json({
                error: "User not found for the provided UserID."
            });
        }

        const userType = (row.Type || "").toLowerCase();
        const status =
            userType === "user"
                ? "Pending Admin Confirmation"
                : "Available";

        // NOTE: DepTime column has been removed from the INSERT.
        // We insert combinedDepDate into DepDate.
        const insertSql = `
            INSERT INTO Space
            (CompID, UserID, Type, Origin, Destination, DepDate, EmptySpaceW, UnitW, EmptySpaceA, UnitA, Restriction, PriceType, Price, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            CompID,
            UserID,
            Type,
            Origin,
            Destination,
            combinedDepDate,      // "YYYY-MM-DD HH:MM"
            emptySpaceNumW,
            UnitW,
            emptySpaceNumA,
            UnitA,
            Restriction || null,
            PriceType,
            finalPrice,
            status
        ];

        db.run(insertSql, values, function (insertErr) {
            if (insertErr) {
                console.error("--- DB ERROR (INSERT INTO Space) ---", insertErr);
                return res.status(500).json({
                    error:
                        "Failed to create listing due to a database insertion error. Please check server logs."
                });
            }

            return res.json({
                message: "Listing created successfully",
                refId: this.lastID
            });
        });
    });
});

module.exports = router;
