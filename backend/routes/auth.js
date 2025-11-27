const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/database");

const router = express.Router();

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = `
        SELECT 
            U.ID,
            U.Name,
            U.Email,
            U.PasswordHash,
            U.CompID,
            C.CompName AS CompanyName
        FROM User U
        LEFT JOIN Company C ON U.CompID = C.CompID
        WHERE U.Email = ?
    `;

    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (!user) return res.status(400).json({ error: "Email not found" });

        const valid = await bcrypt.compare(password, user.PasswordHash);
        if (!valid) return res.status(401).json({ error: "Incorrect password" });

        res.json({
            message: "Login successful",
            user: {
                id: user.ID,
                name: user.Name,
                email: user.Email,
                companyId: user.CompID,
                companyName: user.CompanyName  
            }
        });
    });
});

module.exports = router;
