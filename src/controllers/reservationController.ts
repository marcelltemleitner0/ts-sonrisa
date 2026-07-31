import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Reservation } from "../models/Reservation";

const ReservationRepository = AppDataSource.getRepository(Reservation);



export class ReservationController {
  static async getAllReservation(req: Request, res: Response) {
    try {
      const allReservations = await ReservationRepository.find({
        relations: {
          user: true,
          parkingSpot: true,
        },
      });

      res.status(200).json(allReservations);
    }
    catch(error) {
      res.status(500).json({
        message: "Failed to fetch AllParkingSpots",
        error,
      });
    }
  }
}
