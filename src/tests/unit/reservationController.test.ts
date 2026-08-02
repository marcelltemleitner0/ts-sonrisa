import { Request, Response } from "express";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";


const mockReservationRepository = {
  find: jest.fn<any>(),
  findOne: jest.fn<any>(),
  create: jest.fn<any>(),
  save: jest.fn<any>(),
  createQueryBuilder: jest.fn<any>(),
};

const mockUserRepository = {
  findOne: jest.fn<any>(),
};

const mockParkingRepository = {
  findOne: jest.fn<any>(),
};


jest.mock("../../database", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      switch (entity.name) {
        case "Reservation":
          return mockReservationRepository;
        case "User":
          return mockUserRepository;
        case "ParkingSpot":
          return mockParkingRepository;
        default:
          return {};
      }
    }),
  },
}));

import { ReservationController } from "../../controllers/reservationController";
import { ReservationStatus } from "../../models/Reservation";

describe("ReservationController Extended Unit Tests", () => {
  let req: Partial<Request>;
  let res: any;
  let json: jest.Mock<any>;
  let status: jest.Mock<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};
    json = jest.fn().mockReturnThis();
    status = jest.fn().mockImplementation(() => ({ json }));
    res = { status, json };
  });


  describe("getAllReservation", () => {
    it("should successfully return all reservations with matching entities configured", async () => {
      const mockReservations = [
        { id: 1, user: { id: 101 }, parkingSpot: { id: "Spot-A" } },
      ];
      mockReservationRepository.find.mockResolvedValue(mockReservations);

      await ReservationController.getAllReservation(req as Request, res as Response);

      expect(mockReservationRepository.find).toHaveBeenCalledWith({
        relations: { user: true, parkingSpot: true },
      });
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(mockReservations);
    });

    it("should return a 500 status when the repository throws an error inside the block", async () => {
      mockReservationRepository.find.mockRejectedValue(new Error("Database breakdown"));

      await ReservationController.getAllReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        message: "Failed to fetch AllParkingSpots",
      });
    });
  });


  describe("createReservation", () => {
    it("should successfully write a reservation record if validations and slot dependencies clear", async () => {
      req = {
        body: {
          user_id: 42,
          parking_spot_id: "Spot-B",
          start_time: "2026-08-02T10:00:00.000Z",
          end_time: "2026-08-02T12:00:00.000Z",
        },
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 42 });
      mockParkingRepository.findOne.mockResolvedValue({ id: "Spot-B" });


      const getOne = jest.fn<any>().mockResolvedValue(null);
      const andWhere = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      mockReservationRepository.createQueryBuilder.mockReturnValue({ where, andWhere, getOne });

      const mockSavedOutput = { id: 500, user_id: 42, parking_spot_id: "Spot-B" };
      mockReservationRepository.create.mockReturnValue(mockSavedOutput);
      mockReservationRepository.save.mockResolvedValue(mockSavedOutput);

      await ReservationController.createReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith({
        message: "Reservation created successfully",
        reservation: mockSavedOutput,
      });
    });

    it("should return 400 when start time matches or falls past end time", async () => {
      req = {
        body: {
          start_time: "2026-08-02T15:00:00.000Z",
          end_time: "2026-08-02T14:00:00.000Z",
        },
      };

      await ReservationController.createReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: "Start time must be before end time",
      });
    });

    it("should return 404 when target user record context is missing", async () => {
      req = {
        body: {
          user_id: 999,
          parking_spot_id: "Spot-A",
          start_time: "2026-08-02T10:00:00.000Z",
          end_time: "2026-08-02T11:00:00.000Z",
        },
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await ReservationController.createReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ message: "User does not exist" });
    });

    it("should return 404 when target parking spot record context is missing", async () => {
      req = {
        body: {
          user_id: 42,
          parking_spot_id: "Missing-Spot",
          start_time: "2026-08-02T10:00:00.000Z",
          end_time: "2026-08-02T11:00:00.000Z",
        },
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 42 });
      mockParkingRepository.findOne.mockResolvedValue(null);

      await ReservationController.createReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ message: "Parking spot does not exist" });
    });

    it("should return 409 conflict scenario when an overlapping slot is captured", async () => {
      req = {
        body: {
          user_id: 42,
          parking_spot_id: "Spot-A",
          start_time: "2026-08-02T10:00:00.000Z",
          end_time: "2026-08-02T12:00:00.000Z",
        },
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 42 });
      mockParkingRepository.findOne.mockResolvedValue({ id: "Spot-A" });

      const getOne = jest.fn<any>().mockResolvedValue({ id: 111, status: ReservationStatus.APPROVED });
      const andWhere = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      mockReservationRepository.createQueryBuilder.mockReturnValue({ where, andWhere, getOne });

      await ReservationController.createReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(409);
      expect(json).toHaveBeenCalledWith({
        message: "Parking spot is already reserved for this time.",
      });
    });

    it("should handle error bubbles safely by delivering a status code 500 payload", async () => {
      req = { body: {} };
      mockParkingRepository.findOne.mockRejectedValue(new Error("Fatal Exception"));

      await ReservationController.createReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Failed to create reservation" })
      );
    });
  });


  describe("getUserReservations", () => {
    it("should query parameters safely using explicit numerical transformation keys", async () => {
      req = { params: { userId: "55" } };
      const dataPayload = [{ id: 4, user_id: 55 }];
      mockReservationRepository.find.mockResolvedValue(dataPayload);

      await ReservationController.getUserReservations(req as Request, res as Response);

      expect(mockReservationRepository.find).toHaveBeenCalledWith({
        where: { user_id: 55 },
        relations: { parkingSpot: true },
        order: { start_time: "DESC" },
      });
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(dataPayload);
    });

    it("should drop into catch block gracefully if fetching records suffers internal failure", async () => {
      req = { params: { userId: "55" } };
      mockReservationRepository.find.mockRejectedValue(new Error("Connection Dropped"));

      await ReservationController.getUserReservations(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Failed to fetch user reservations" })
      );
    });
  });


  describe("CancelReservation", () => {
    it("should cancel valid upcoming reservation and alter field state data seamlessly", async () => {
      req = { params: { reservationId: "777" } };
      const livingReservation = {
        id: 777,
        end_time: new Date(Date.now() + 500000),
        status: ReservationStatus.APPROVED,
      };

      mockReservationRepository.findOne.mockResolvedValue(livingReservation);
      mockReservationRepository.save.mockResolvedValue(livingReservation);

      await ReservationController.CancelReservation(req as Request, res as Response);

      expect(livingReservation.status).toBe(ReservationStatus.CANCELLED);
      expect(mockReservationRepository.save).toHaveBeenCalledWith(livingReservation);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        message: "Reservation cancelled successfully.",
        reservation: livingReservation,
      });
    });

    it("should return a 404 status code when matching row is absent entirely", async () => {
      req = { params: { reservationId: "99" } };
      mockReservationRepository.findOne.mockResolvedValue(null);

      await ReservationController.CancelReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ message: "Reservation not found" });
    });

    it("should reject action and output 400 when reservation time matrix already crossed bounds into the past", async () => {
      req = { params: { reservationId: "123" } };
      const expiredReservation = {
        id: 123,
        end_time: new Date(Date.now() - 50000),
        status: ReservationStatus.APPROVED,
      };

      mockReservationRepository.findOne.mockResolvedValue(expiredReservation);

      await ReservationController.CancelReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: "You cannot cancel a reservation that has already ended.",
      });
    });

    it("should refuse process and send 400 when the flag is already registered as CANCELLED", async () => {
      req = { params: { reservationId: "123" } };
      const cancelledReservation = {
        id: 123,
        end_time: new Date(Date.now() + 500000),
        status: ReservationStatus.CANCELLED,
      };

      mockReservationRepository.findOne.mockResolvedValue(cancelledReservation);

      await ReservationController.CancelReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: "Reservation has already been cancelled.",
      });
    });

    it("should rescue errors smoothly on failure pipeline gracefully through 500 response model", async () => {
      req = { params: { reservationId: "123" } };
      mockReservationRepository.findOne.mockRejectedValue(new Error("Disruption"));

      await ReservationController.CancelReservation(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Failed to cancel reservation" })
      );
    });
  });
});
