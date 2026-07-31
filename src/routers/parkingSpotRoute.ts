import { Router } from "express";
import { ParkingSpotController } from "../controllers/parkingSpotController";

const router = Router();

router.get("/api/v1/GetAllParkingSpot", ParkingSpotController.GetAllParkingSpot);

export default router;
