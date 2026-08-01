import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Reservation, ReservationStatus } from "../models/Reservation";
import {ParkingSpot} from "../models/ParkingSpot"
import { User } from "../models/User";

const userRepository = AppDataSource.getRepository(User);
const ReservationRepository = AppDataSource.getRepository(Reservation);
const ParkingRepoistory = AppDataSource.getRepository(ParkingSpot);



export class ReservationController {
  static async getAllReservation(req: Request, res: Response) {
    try {
      const allReservations = await ReservationRepository.find({
        relations: {
          user: true,
          parkingSpot: true,
        },
      });

      return res.status(200).json(allReservations);
    }
    catch(error) {
      return res.status(500).json({
        message: "Failed to fetch AllParkingSpots"
      });
    }
  }

  static async createReservation(req: Request, res: Response) {
    try {
      const { user_id, parking_spot_id, start_time, end_time } = req.body;

      const start = new Date(start_time);
      const end = new Date(end_time);



      //Basic validation
      if (start >= end) {
        return res.status(400).json({
          message: "Start time must be before end time",
        });
      }

      const parkingSpot = await ParkingRepoistory.findOne({
        where: { id: parking_spot_id },
      });

      const FindUser = await userRepository.findOne({
        where: { id: user_id },
      });

      if (!FindUser) {
        return res.status(404).json({
          message: "User does not exist",
        });
      }


      if (!parkingSpot) {
        return res.status(404).json({
          message: "Parking spot does not exist",
        });
      }

        //


      const existingReservation = await ReservationRepository
        .createQueryBuilder("reservation")
        .where("reservation.parking_spot_id = :parkingSpotId", {
          parkingSpotId: parking_spot_id,
        })
        .andWhere("reservation.status = :status", {
          status: ReservationStatus.APPROVED,
        })
        .andWhere(
          "reservation.start_time < :end AND reservation.end_time > :start",
          {
            start,
            end,
          }
        )
        .getOne();

      if (existingReservation) {
        return res.status(409).json({
          message: "Parking spot is already reserved for this time.",
        });
      }

      const reservation = ReservationRepository.create({
        user_id,
        parking_spot_id,
        start_time: start,
        end_time: end,
      });

      await ReservationRepository.save(reservation);

      return res.status(201).json({
        message: "Reservation created successfully",
        reservation,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to create reservation",
        error,
      });
    }
  }


  static async getUserReservations(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const reservations = await ReservationRepository.find({
        where: {
          user_id: Number(userId),
        },
        relations: {
          parkingSpot: true,
        },
        order: {
          start_time: "DESC",
        },
      });

      return res.status(200).json(reservations);
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch user reservations",
        error,
      });
    }
  }









}
