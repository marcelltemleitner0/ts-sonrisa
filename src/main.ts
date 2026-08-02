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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../src/views"));
app.use(express.static(path.join(__dirname, "../public")));

app.use("/", pageRoutes);
app.use("/", userRoutes);
app.use("/", parkingSpotRoutes);
app.use("/", reservationRoutes);

app.get("/", (req, res) => {
    res.render("index", {
        message: "Server is running"
    });
});

const PORT = 3000;

AppDataSource.initialize()
    .then(() => {
        console.log("Database connected and TypeORM metadata loaded successfully!");

        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Error during Database initialization:", error);
    });

export default app;
