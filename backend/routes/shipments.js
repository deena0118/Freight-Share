const express = require("express");
const db = require("../db/database"); 

const router = express.Router();


router.get("/", (req, res) => {
   const sql = `
  SELECT
    s.*,
    c.CompName,
    COALESCE(c.CompDesc, '') AS CompDesc
  FROM Space AS s
  LEFT JOIN "Company" c ON c.CompID = s.CompID
  WHERE s.Status = 'Available'
`;


    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("--- DB ERROR (SELECT Space + Company) ---", err);
            return res
                .status(500)
                .json({ error: "Failed to load shipments from database." });
        }



        return res.json({ spaces: rows });
    });
});

module.exports = router;
