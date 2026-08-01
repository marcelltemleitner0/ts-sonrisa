import "reflect-metadata";

import express from "express";
import path from "path";

import { AppDataSource } from "./database";

import userRoutes from "./routers/userRoute";
import parkingSpotRoutes from "./routers/parkingSpotRoute";
import reservationRoutes from "./routers/reservationRoute";

import pageRoutes from "./routers/pageRoute";


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", pageRoutes);

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../src/views"));

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/", userRoutes);
app.use("/", parkingSpotRoutes);
app.use("/", reservationRoutes);


app.get("/", (req, res) => {
    res.render("index", {
        message: "Server is running"
    });
});


AppDataSource.initialize()
    .then(() => {
        console.log("Database connected");

        app.listen(3000, () => {
            console.log(
                "Server running on port 3000"
            );
        });
    })
    .catch((error) => {
        console.error(
            "Database connection failed:",
            error
        );
    });
