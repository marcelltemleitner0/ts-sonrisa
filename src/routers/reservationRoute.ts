import { Router } from "express";
import { ReservationController } from "../controllers/reservationController";

const router = Router();

router.get("/api/v1/getAllReservation", ReservationController.getAllReservation);

export default router;
