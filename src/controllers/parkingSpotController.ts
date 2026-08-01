import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { ParkingSpot } from "../models/ParkingSpot";
import { Reservation,ReservationStatus } from "../models/Reservation";


const ParkingRepository = AppDataSource.getRepository(ParkingSpot);

export class ParkingSpotController {

  static async FreeParkingSpot(req: Request, res: Response) {
    try {
      const now = new Date();

      const freeSpots = await ParkingRepository
        .createQueryBuilder("parking_spot")
        .leftJoin(
          Reservation,
          "reservation",
          `
          reservation.parking_spot_id = parking_spot.id
          AND reservation.status = :status
          AND reservation.start_time <= :now
          `,
        )
        .where("reservation.id IS NULL")
        .setParameters({
          status: ReservationStatus.APPROVED,
          now,
        })
        .getMany();

      return res.status(200).json({
        message: "Free parking spots",
        parkingSpots: freeSpots,
      });

    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch free parking spots",
      });
    }
  }






  static async GetAllParkingSpot(req: Request, res: Response) {
    try {
      const AllParkingSpots = await ParkingRepository.find({
        select: {
          id: true
        }
      })





      res.status(200).json(AllParkingSpots);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch AllParkingSpots",
        error,
      });
    }
  }







}
