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
        DepDate,
        DepTime,
        EmptySpace,
        Unit,
        Restriction,
        PriceType,
        Price
    } = req.body;

    if (
        !CompID ||
        !UserID ||
        !Type ||
        !Origin ||
        !Destination ||
        !DepDate ||
        !DepTime ||
        !EmptySpace ||
        !Unit ||
        !PriceType
    ) {
        return res
            .status(400)
            .json({ error: "Missing required listing fields in the request body." });
    }

    const emptySpaceNum = parseInt(EmptySpace, 10);
    if (isNaN(emptySpaceNum) || emptySpaceNum <= 0) {
        return res
            .status(400)
            .json({ error: "Empty space must be a positive number." });
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

        const insertSql = `
            INSERT INTO Space
            (CompID, UserID, Type, Origin, Destination, DepDate, DepTime, EmptySpace, Unit, Restriction, PriceType, Price, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            CompID,
            UserID,
            Type,
            Origin,
            Destination,
            DepDate,
            DepTime,
            emptySpaceNum,
            Unit,
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
