import request from "supertest";
import app from "../../main";
import { AppDataSource } from "../../database";
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

describe("POST /api/v1/CreateUser Integration Test", () => {

  it("should create a user", async () => {
    const response = await request(app)
      .post("/api/v1/CreateUser")
      .send({
        name: "John",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: "John",
      })
    );
    expect(response.body.id).toBeDefined();
  });

  it("should reject empty name", async () => {
    const response = await request(app)
      .post("/api/v1/CreateUser")
      .send({
        name: "",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Name is required",
    });
  });

  it("should reject non-string name", async () => {
    const response = await request(app)
      .post("/api/v1/CreateUser")
      .send({
        name: 123,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Name must be a string");
  });

  it("should reject short names", async () => {
    const response = await request(app)
      .post("/api/v1/CreateUser")
      .send({
        name: "A",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Name must be at least 2 characters long"
    );
  });

  it("should trim user name before saving", async () => {
    const response = await request(app)
      .post("/api/v1/CreateUser")
      .send({
        name: "  Alice  ",
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Alice");
  });
});
