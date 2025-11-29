const path = require("path");
const express = require("express");

const app = express();
const port = 5034;
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const spaceRoutes = require("./routes/space"); 
app.use("/space", spaceRoutes); 


const shipmentsRoutes = require("./routes/shipments");
app.use("/shipments", shipmentsRoutes);

const bookingsRoutes = require("./routes/bookings");
app.use("/bookings", bookingsRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

    import('open').then(openModule => {
        openModule.default(`http://localhost:${port}`).catch(err => {
            console.error('Failed to open browser:', err);
        });
    }).catch(importErr => {
        console.error('Failed to load open module:', importErr);
    });
});