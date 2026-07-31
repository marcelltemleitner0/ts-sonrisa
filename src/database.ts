import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "./models/User";
import { ParkingSpot } from "./models/ParkingSpot";
import { Reservation } from "./models/Reservation";


export const AppDataSource = new DataSource({

    type: "postgres",

    host: "localhost",

    port: 5432,

    username: "postgres",

    password: "postgres",

    database: "parking_db",

    entities: [
        User,
        ParkingSpot,
        Reservation
    ],

    synchronize: true,

    logging: true

});
