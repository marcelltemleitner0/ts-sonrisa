import { Router } from "express";
import { ReservationController } from "../controllers/reservationController";

const router = Router();

router.get("/api/v1/getAllReservation", ReservationController.getAllReservation);
router.post("/api/v1/CreateReservation", ReservationController.createReservation);


export default router;
