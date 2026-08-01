import { Request, Response } from "express";
import { UserController } from "../../controllers/userController";
import { AppDataSource } from "../../database";
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock("../../database", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("UserController.createUser Unit Test", () => {
  let req: Partial<Request>;
  let res: any;

  let mockCreateUser: jest.Mock<any>;
  let mockSaveUser: jest.Mock<any>;

  let json: jest.Mock<any>;
  let status: jest.Mock<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    json = jest.fn().mockReturnThis();
    status = jest.fn().mockImplementation(() => ({ json }));

    res = {
      status,
      json,
    };

    mockCreateUser = jest.fn();
    mockSaveUser = jest.fn();

    (AppDataSource.getRepository as any).mockImplementation((model: any) => {
      if (model && model.name === "User") {
        return {
          create: mockCreateUser,
          save: mockSaveUser,
        };
      }
      return {};
    });
  });

  it("should create a user successfully", async () => {
    req = {
      body: {
        name: "John",
      },
    };

    const mockUser = {
      id: 1,
      name: "John",
    };

    mockCreateUser.mockReturnValue(mockUser);
    mockSaveUser.mockResolvedValue(mockUser);

    await UserController.createUser(
      req as Request,
      res as Response
    );

    expect(mockCreateUser).toHaveBeenCalledWith({
      name: "John",
    });

    expect(mockSaveUser).toHaveBeenCalledWith(mockUser);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(mockUser);
  });

  it("should return 400 when name is missing", async () => {
    req = {
      body: {},
    };

    await UserController.createUser(
      req as Request,
      res as Response
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: "Name is required",
    });
  });

  it("should return 400 when name is not a string", async () => {
    req = {
      body: {
        name: 123,
      },
    };

    await UserController.createUser(
      req as Request,
      res as Response
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: "Name must be a string",
    });
  });

  it("should return 400 when name is less than 2 characters", async () => {
    req = {
      body: {
        name: "A",
      },
    };

    await UserController.createUser(
      req as Request,
      res as Response
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: "Name must be at least 2 characters long",
    });
  });

  it("should return 500 when database save fails", async () => {
    req = {
      body: {
        name: "John",
      },
    };

    mockCreateUser.mockReturnValue({
      name: "John",
    });
    mockSaveUser.mockRejectedValue(new Error("DB Error"));

    await UserController.createUser(
      req as Request,
      res as Response
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to create user",
      })
    );
  });
});
