import request from "supertest";
import app from "../../main";
import { AppDataSource } from "../../database";
import { Reservation, ReservationStatus } from "../../models/Reservation";
import { ParkingSpot } from "../../models/ParkingSpot";
import { User } from "../../models/User";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
} from "@jest/globals";

beforeAll(async () => {
  AppDataSource.setOptions({
    logging: false,
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
    logging: false,
  });

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterEach(async () => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.query(
      'TRUNCATE TABLE "reservation", "parking_spot", "user" RESTART IDENTITY CASCADE;'
    );
  } finally {
    await queryRunner.release();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe("Reservation Controller Integration Tests", () => {
  describe("GET /api/v1/getAllReservation", () => {
    it("should return all reservations with user and parking spot", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const reservationRepo = AppDataSource.getRepository(Reservation);

      const user = await userRepo.save(
        userRepo.create({
          name: "John",
        })
      );

      const spot = await spotRepo.save(
        spotRepo.create({
          id: "A1",
        })
      );

      await reservationRepo.save(
        reservationRepo.create({
          user,
          parkingSpot: spot,
          start_time: new Date(),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
          status: ReservationStatus.APPROVED,
        })
      );

      const response = await request(app).get("/api/v1/getAllReservation");

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);

      expect(response.body[0].user.name).toBe("John");
      expect(response.body[0].parkingSpot.id).toBe("A1");
    });

    it("should return an empty array when no reservations exist", async () => {
      const response = await request(app).get("/api/v1/getAllReservation");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("POST /api/v1/CreateReservation", () => {
    it("should create a reservation successfully", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);

      const user = await userRepo.save(
        userRepo.create({
          name: "John",
        })
      );

      const spot = await spotRepo.save(
        spotRepo.create({
          id: "A1",
        })
      );

      const response = await request(app)
        .post("/api/v1/CreateReservation")
        .send({
          user_id: user.id,
          parking_spot_id: spot.id,
          start_time: new Date(Date.now() + 60 * 1000),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Reservation created successfully");
    });

    it("should reject a reservation if the start time is in the past", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);

      const user = await userRepo.save(userRepo.create({ name: "John" }));
      const spot = await spotRepo.save(spotRepo.create({ id: "A1" }));

      const response = await request(app)
        .post("/api/v1/CreateReservation")
        .send({
          user_id: user.id,
          parking_spot_id: spot.id,
          start_time: new Date(Date.now() - 60 * 60 * 1000),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Cannot create a reservation in the past");
    });

    it("should reject a reservation if the start time is not before the end time", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);

      const user = await userRepo.save(userRepo.create({ name: "John" }));
      const spot = await spotRepo.save(spotRepo.create({ id: "A1" }));

      const startTime = new Date(Date.now() + 60 * 60 * 1000);

      const response = await request(app)
        .post("/api/v1/CreateReservation")
        .send({
          user_id: user.id,
          parking_spot_id: spot.id,
          start_time: startTime,
          end_time: startTime,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Start time must be before end time");
    });

    it("should reject overlapping reservations", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const reservationRepo = AppDataSource.getRepository(Reservation);

      const user = await userRepo.save(
        userRepo.create({
          name: "John",
        })
      );

      const spot = await spotRepo.save(
        spotRepo.create({
          id: "A1",
        })
      );

      const start = new Date(Date.now() + 60 * 1000);
      const end = new Date(Date.now() + 60 * 60 * 1000);

      await reservationRepo.save(
        reservationRepo.create({
          user,
          parkingSpot: spot,
          start_time: start,
          end_time: end,
          status: ReservationStatus.APPROVED,
        })
      );

      const response = await request(app)
        .post("/api/v1/CreateReservation")
        .send({
          user_id: user.id,
          parking_spot_id: spot.id,
          start_time: start,
          end_time: end,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Parking spot is already reserved for this time."
      );
    });

    it("should reject reservation when user does not exist", async () => {
      const spotRepo = AppDataSource.getRepository(ParkingSpot);

      const spot = await spotRepo.save(
        spotRepo.create({
          id: "A1",
        })
      );

      const response = await request(app)
        .post("/api/v1/CreateReservation")
        .send({
          user_id: 999,
          parking_spot_id: spot.id,
          start_time: new Date(Date.now() + 60 * 1000),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User does not exist");
    });

    it("should reject reservation when parking spot does not exist", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.save(userRepo.create({ name: "John" }));

      const response = await request(app)
        .post("/api/v1/CreateReservation")
        .send({
          user_id: user.id,
          parking_spot_id: "NON_EXISTENT_ID",
          start_time: new Date(Date.now() + 60 * 1000),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Parking spot does not exist");
    });
  });

  describe("GET /api/v1/myReservation/:userId", () => {
    it("should return reservations belonging to the requested user", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const reservationRepo = AppDataSource.getRepository(Reservation);

      const user = await userRepo.save(
        userRepo.create({
          name: "John",
        })
      );

      const spot = await spotRepo.save(
        spotRepo.create({
          id: "A1",
        })
      );

      await reservationRepo.save(
        reservationRepo.create({
          user,
          parkingSpot: spot,
          start_time: new Date(),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
          status: ReservationStatus.APPROVED,
        })
      );

      const response = await request(app).get(
        `/api/v1/myReservation/${user.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].parkingSpot.id).toBe("A1");
    });

    it("should return an empty array for users with no reservations", async () => {
      const response = await request(app).get("/api/v1/myReservation/999");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("PATCH /api/v1/CancelReservation/:reservationId", () => {
    it("should cancel an active reservation", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const reservationRepo = AppDataSource.getRepository(Reservation);

      const user = await userRepo.save(
        userRepo.create({
          name: "John",
        })
      );

      const spot = await spotRepo.save(
        spotRepo.create({
          id: "A1",
        })
      );

      const reservation = await reservationRepo.save(
        reservationRepo.create({
          user,
          parkingSpot: spot,
          start_time: new Date(),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
          status: ReservationStatus.APPROVED,
        })
      );

      const response = await request(app).patch(
        `/api/v1/CancelReservation/${reservation.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Reservation cancelled successfully."
      );

      const updated = await reservationRepo.findOne({
        where: {
          id: reservation.id,
        },
      });

      expect(updated?.status).toBe(ReservationStatus.CANCELLED);
    });

    it("should return 404 when reservation does not exist", async () => {
      const response = await request(app).patch(
        "/api/v1/CancelReservation/999"
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Reservation not found");
    });

    it("should reject cancelling an already cancelled reservation", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const reservationRepo = AppDataSource.getRepository(Reservation);

      const user = await userRepo.save(
        userRepo.create({
          name: "John",
        })
      );

      const spot = await spotRepo.save(
        spotRepo.create({
          id: "A1",
        })
      );

      const reservation = await reservationRepo.save(
        reservationRepo.create({
          user,
          parkingSpot: spot,
          start_time: new Date(),
          end_time: new Date(Date.now() + 60 * 60 * 1000),
          status: ReservationStatus.CANCELLED,
        })
      );

      const response = await request(app).patch(
        `/api/v1/CancelReservation/${reservation.id}`
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Reservation has already been cancelled."
      );
    });

    it("should reject cancelling a reservation that has already ended", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const spotRepo = AppDataSource.getRepository(ParkingSpot);
      const reservationRepo = AppDataSource.getRepository(Reservation);

      const user = await userRepo.save(userRepo.create({ name: "John" }));
      const spot = await spotRepo.save(spotRepo.create({ id: "A1" }));

      const reservation = await reservationRepo.save(
        reservationRepo.create({
          user,
          parkingSpot: spot,
          start_time: new Date(Date.now() - 2 * 60 * 60 * 1000),
          end_time: new Date(Date.now() - 60 * 60 * 1000),
          status: ReservationStatus.APPROVED,
        })
      );

      const response = await request(app).patch(
        `/api/v1/CancelReservation/${reservation.id}`
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "You cannot cancel a reservation that has already ended."
      );
    });
  });
});
