import { Router } from "express";
import { ParkingSpotController } from "../controllers/parkingSpotController";

const router = Router();

router.get("/api/v1/GetAllParkingSpot", ParkingSpotController.GetAllParkingSpot);
router.get("/api/v1/GetFreeParkingSpot", ParkingSpotController.FreeParkingSpot);

export default router;
