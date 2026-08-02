import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./database";

const PORT = process.env.PORT || 3000;

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
