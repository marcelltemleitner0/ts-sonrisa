import request from "supertest";
import app from "../../main";
import { AppDataSource } from "../../database";
import { ParkingSpot } from "../../models/ParkingSpot";
import { Reservation, ReservationStatus } from "../../models/Reservation";
import { User } from "../../models/User";
import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';

beforeAll(async () => {
  AppDataSource.setOptions({
    logging: false
  });

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();

  const dbCheck = await queryRunner.query(
    "SELECT 1 FROM pg_database WHERE datname = 'parking_db_test'"
  );

  if (dbCheck.length === 0) {
    await queryRunner.query("COMMIT;");
    await queryRunner.query("CREATE DATABASE parking_db_test;");
  }

  await queryRunner.release();
  await AppDataSource.destroy();

  AppDataSource.setOptions({
    database: "parking_db_test",
    logging: false
  });

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterEach(async () => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    await queryRunner.query('TRUNCATE TABLE "reservation", "parking_spot", "user" RESTART IDENTITY CASCADE;');
  } finally {
    await queryRunner.release();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe("ParkingSpot Controller Integration Tests", () => {

  describe("GET /api/v1/GetAllParkingSpot", () => {
    it("should return all existing parking spots mapping only the ID field", async () => {
      const repo = AppDataSource.getRepository(ParkingSpot);

      await repo.save([
        repo.create({ id: "A1" }),
        repo.create({ id: "A2" })
      ]);

      const response = await request(app)
        .get("/api/v1/GetAllParkingSpot");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      expect(response.body).toEqual([
        { id: "A1" },
        { id: "A2" }
      ]);
    });

    it("should return an empty array if no parking spots exist", async () => {
      const response = await request(app)
        .get("/api/v1/GetAllParkingSpot");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/v1/GetFreeParkingSpot", () => {
    it("should identify free parking spots containing no active conflicting reservations", async () => {
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const userRepo = AppDataSource.getRepository(User);
      const resRepo = AppDataSource.getRepository(Reservation);

      const spotA1 = await spotRepo.save(spotRepo.create({ id: "A1" }));
      const spotA2 = await spotRepo.save(spotRepo.create({ id: "A2" }));

      const user = await userRepo.save(userRepo.create({ name: "Test User" }));

      const now = new Date();
      const startTime = new Date(now.getTime() - 15 * 60 * 1000);
      const endTime = new Date(now.getTime() + 15 * 60 * 1000);

      await resRepo.save(resRepo.create({
        status: ReservationStatus.APPROVED,
        start_time: startTime,
        end_time: endTime,
        parkingSpot: spotA1,
        user: user
      }));

      const response = await request(app)
        .get("/api/v1/GetFreeParkingSpot");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Free parking spots");

      expect(response.body.parkingSpots).toEqual([
        { id: "A2" }
      ]);
    });

    it("should treat expired reservations as open, returnable spots", async () => {
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const userRepo = AppDataSource.getRepository(User);
      const resRepo = AppDataSource.getRepository(Reservation);

      const spotA1 = await spotRepo.save(spotRepo.create({ id: "A1" }));
      const user = await userRepo.save(userRepo.create({ name: "Test User" }));

      const now = new Date();
      const startTime = new Date(now.getTime() - 120 * 60 * 1000);
      const endTime = new Date(now.getTime() - 60 * 1000);

      await resRepo.save(resRepo.create({
        status: ReservationStatus.APPROVED,
        start_time: startTime,
        end_time: endTime,
        parkingSpot: spotA1,
        user: user
      }));

      const response = await request(app)
        .get("/api/v1/GetFreeParkingSpot");

      expect(response.status).toBe(200);
      expect(response.body.parkingSpots).toEqual([
        { id: "A1" }
      ]);
    });
  });
});
