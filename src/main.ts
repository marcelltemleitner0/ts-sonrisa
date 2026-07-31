import "reflect-metadata";

import express from "express";
import { AppDataSource } from "./database";
import userRoutes from "./routers/userRoute";
import parkingSpotRoutes from "./routers/parkingSpotRoute"
import reservationRoutes from "./routers/reservationRoute"

const app = express();

app.use(express.json());

// Routes
app.use("/", userRoutes);
app.use("/", parkingSpotRoutes);
app.use("/", reservationRoutes);


app.get("/", (req, res) => {
    res.json({
        status: "ok"
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
