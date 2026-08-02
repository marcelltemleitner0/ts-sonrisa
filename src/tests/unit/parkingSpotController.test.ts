import { Request, Response } from "express";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockFind: jest.Mock<any> = jest.fn();
const mockCreateQueryBuilder: jest.Mock<any> = jest.fn();

const mockRepository = {
  find: mockFind,
  createQueryBuilder: mockCreateQueryBuilder,
};

jest.mock("../../database", () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  },
}));


import { ParkingSpotController } from "../../controllers/parkingSpotController";

describe("ParkingSpotController Unit Test", () => {
  let req: Partial<Request>;
  let res: any;

  let json: jest.Mock<any>;
  let status: jest.Mock<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};

    json = jest.fn().mockReturnThis();
    status = jest.fn().mockImplementation(() => ({
      json,
    }));

    res = {
      status,
      json,
    };

    mockFind.mockReset();
    mockCreateQueryBuilder.mockReset();
  });

  describe("GetAllParkingSpot", () => {
    it("should return all parking spots", async () => {
      const mockParkingSpots = [{ id: "A1" }, { id: "A2" }];
      mockFind.mockResolvedValue(mockParkingSpots);

      await ParkingSpotController.GetAllParkingSpot(
        req as Request,
        res as Response
      );

      expect(mockFind).toHaveBeenCalledWith({
        select: { id: true },
      });

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(mockParkingSpots);
    });

    it("should return 500 when database fails", async () => {
      mockFind.mockRejectedValue(new Error("Database error"));

      await ParkingSpotController.GetAllParkingSpot(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Failed to fetch AllParkingSpots",
        })
      );
    });
  });

  describe("FreeParkingSpot", () => {
    it("should return free parking spots", async () => {
      const mockSpots = [{ id: "A1" }, { id: "A2" }];

      const getMany = jest.fn<any>().mockResolvedValue(mockSpots);
      const setParameters = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const leftJoin = jest.fn().mockReturnThis();

      mockCreateQueryBuilder.mockReturnValue({
        leftJoin,
        where,
        setParameters,
        getMany,
      });

      await ParkingSpotController.FreeParkingSpot(
        req as Request,
        res as Response
      );

      expect(leftJoin).toHaveBeenCalled();
      expect(setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "APPROVED",
          now: expect.any(Date),
        })
      );

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        message: "Free parking spots",
        parkingSpots: mockSpots,
      });
    });

    it("should return 500 when query fails", async () => {
      mockCreateQueryBuilder.mockImplementation(() => {
        throw new Error("Query error");
      });

      await ParkingSpotController.FreeParkingSpot(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        message: "Failed to fetch free parking spots",
      });
    });
  });
});
