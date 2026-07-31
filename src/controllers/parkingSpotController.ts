import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { ParkingSpot } from "../models/ParkingSpot";

const ParkingRepoistory = AppDataSource.getRepository(ParkingSpot);


export class ParkingSpotController {
  static async GetAllParkingSpot(req: Request, res: Response) {
    try {
      const AllParkingSpots = await ParkingRepoistory.find({
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
