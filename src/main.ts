import "reflect-metadata";
import express from "express";
import path from "path";

import userRoutes from "./routers/userRoute";
import parkingSpotRoutes from "./routers/parkingSpotRoute";
import reservationRoutes from "./routers/reservationRoute";
import pageRoutes from "./routers/pageRoute";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../src/views"));

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/", pageRoutes);
app.use("/", userRoutes);
app.use("/", parkingSpotRoutes);
app.use("/", reservationRoutes);

app.get("/", (req, res) => {
    res.render("index", {
        message: "Server is running"
    });
});

export default app;
