import { Router } from "express";
import { ReservationController } from "../controllers/reservationController";

const router = Router();

router.get("/api/v1/getAllReservation", ReservationController.getAllReservation);
router.post("/api/v1/CreateReservation", ReservationController.createReservation);
router.get("/api/v1/myReservation/:userId", ReservationController.getUserReservations);
router.patch("/api/v1/CancelReservation/:reservationId", ReservationController.CancelReservation);


export default router;
