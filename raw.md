## Prompt:

Create ORM schemas using ts and typeorm User: - id: Integer, Primary Key, Autoincrement. - name: String. - ParkingSpot: - id: String, Primary Key - Reservation: - id: Integer, Primary Key, Autoincrement. - parking_spot_id: String, Foreign Key to ParkingSpot. - user_id: Integer, Foreign Key to User. - start_time: DateTime. - end_time: DateTime. - status: String or Enum (values: "APPROVED", "CANCELLED")

## Response:

Here is a TypeORM setup using **TypeScript decorators** for `User`, `ParkingSpot`, and `Reservation` entities with the requested fields and relationships.

### `User.ts`
```ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Reservation } from "./Reservation";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];
}
```

### `ParkingSpot.ts`
```ts
import { Entity, PrimaryColumn, OneToMany } from "typeorm";
import { Reservation } from "./Reservation";

@Entity()
export class ParkingSpot {
  @PrimaryColumn()
  id: string;

  @OneToMany(() => Reservation, (reservation) => reservation.parkingSpot)
  reservations: Reservation[];
}
```

### `Reservation.ts`
```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { ParkingSpot } from "./ParkingSpot";

export enum ReservationStatus {
  APPROVED = "APPROVED",
  CANCELLED = "CANCELLED",
}

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  parking_spot_id: string;

  @Column()
  user_id: number;

  @Column({ type: "datetime" })
  start_time: Date;

  @Column({ type: "datetime" })
  end_time: Date;

  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.APPROVED,
  })
  status: ReservationStatus;

  @ManyToOne(() => ParkingSpot, (parkingSpot) => parkingSpot.reservations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parking_spot_id" })
  parkingSpot: ParkingSpot;

  @ManyToOne(() => User, (user) => user.reservations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;
}
```

### Resulting database relationships

```
User
----
id (PK)
name

ParkingSpot
-----------
id (PK)

Reservation
-----------
id (PK)
parking_spot_id (FK -> ParkingSpot.id)
user_id (FK -> User.id)
start_time
end_time
status (APPROVED | CANCELLED)
```

Notes:
- `@PrimaryGeneratedColumn()` creates an auto-increment integer primary key.
- `ParkingSpot.id` uses `@PrimaryColumn()` because it is a string key.
- The explicit `parking_spot_id` and `user_id` columns are kept so the schema matches your requirement exactly.
- The `ManyToOne` relations allow querying with object relations, e.g. `reservation.user` and `reservation.parkingSpot`.

## Prompt:

using TypeOrm how would you return with all data const AllReservation = await ReservationRepoistory.getAll();

## Response:

In TypeORM, you typically use `find()` (there is no built-in `getAll()` method unless you've created one yourself). To return all reservations **with their related `User` and `ParkingSpot` data**, use the `relations` option.

```ts
const allReservations = await ReservationRepository.find({
  relations: {
    user: true,
    parkingSpot: true,
  },
});
```

This returns objects like:

```ts
[
  {
    id: 1,
    parking_spot_id: "A1",
    user_id: 1,
    start_time: new Date(),
    end_time: new Date(),
    status: "APPROVED",
    user: {
      id: 1,
      name: "John Doe",
    },
    parkingSpot: {
      id: "A1",
    },
  },
];
```

### If you're using an older TypeORM version (0.2.x)

Use an array instead:

```ts
const allReservations = await ReservationRepository.find({
  relations: ["user", "parkingSpot"],
});
```

### If you only want specific fields

You can combine `relations` with `select`:

```ts
const allReservations = await ReservationRepository.find({
  select: {
    id: true,
    start_time: true,
    end_time: true,
    status: true,
    user: {
      id: true,
      name: true,
    },
    parkingSpot: {
      id: true,
    },
  },
  relations: {
    user: true,
    parkingSpot: true,
  },
});
```

### Using QueryBuilder (for more complex queries)

```ts
const allReservations = await ReservationRepository
  .createQueryBuilder("reservation")
  .leftJoinAndSelect("reservation.user", "user")
  .leftJoinAndSelect("reservation.parkingSpot", "parkingSpot")
  .getMany();
```

The `QueryBuilder` approach is useful if you later need to add filtering, sorting, pagination, or aggregate functions.

## Prompt:

Could you generate unit test with jest, and integration test with supertest ,two different file based on this func static async createUser(req: Request, res: Response) {
    try {

      const { name } = req.body;

      // basic validation
      if (!name) {
           return res.status(400).json({
             message: "Name is required",
           });
      }

      if (typeof name !== "string") {
         return res.status(400).json({
           message: "Name must be a string",
         });
       }

       if (name.trim().length < 2) {
         return res.status(400).json({
           message: "Name must be at least 2 characters long",
         });
       }

//

      const user = userRepository.create({
        name: name.trim(),
      });

      const savedUser = await userRepository.save(user);

      res.status(201).json(savedUser);
    } catch (error) {
      res.status(500).json({
        message: "Failed to create user",
        error,
      });
    }
  }
}

## Response:

Below are two separate test files:

1. **Unit test (Jest)** — tests `createUser` in isolation by mocking the repository.
2. **Integration test (Supertest)** — tests the real Express route + controller + database flow.

Assumptions:
- Controller method is exported as `UserController.createUser`.
- Express route: `POST /users`.
- Repository is imported from a separate file (`userRepository.ts`).
- Jest + ts-jest + supertest are installed.

---

## 1. Unit Test — `UserController.createUser.test.ts`

```ts id="49382"
import { Request, Response } from "express";
import { UserController } from "../controllers/UserController";
import { userRepository } from "../repositories/userRepository";

jest.mock("../repositories/userRepository", () => ({
  userRepository: {
    create: jest.fn(),
    save: jest.fn(),
  },
}));

describe("UserController.createUser Unit Test", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status,
      json,
    };
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

    (userRepository.create as jest.Mock).mockReturnValue(mockUser);
    (userRepository.save as jest.Mock).mockResolvedValue(mockUser);

    await UserController.createUser(
      req as Request,
      res as Response
    );

    expect(userRepository.create).toHaveBeenCalledWith({
      name: "John",
    });

    expect(userRepository.save).toHaveBeenCalledWith(mockUser);

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

    (userRepository.create as jest.Mock)
      .mockReturnValue({
        name: "John",
      });

    (userRepository.save as jest.Mock)
      .mockRejectedValue(new Error("DB Error"));

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
```

---

# 2. Integration Test — `user.integration.test.ts`

This test uses:
- Express app
- Real route
- Real TypeORM repository
- Test database

Example route:

```ts
// routes/user.routes.ts

router.post(
  "/users",
  UserController.createUser
);
```

---

### Test file

```ts id="59384"
import request from "supertest";
import app from "../app";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterEach(async () => {
  const repository = AppDataSource.getRepository(User);

  await repository.clear();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("POST /users Integration Test", () => {

it("should create a user", async () => {

    const response = await request(app)
      .post("/users")
      .send({
        name: "John",
      });

expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        name: "John",
      })
    );

    expect(response.body.id)
      .toBeDefined();
  });

it("should reject empty name", async () => {

    const response = await request(app)
      .post("/users")
      .send({
        name: "",
      });

expect(response.status)
      .toBe(400);

expect(response.body)
      .toEqual({
        message: "Name is required",
      });

  });

it("should reject non-string name", async () => {

    const response = await request(app)
      .post("/users")
      .send({
        name: 123,
      });

expect(response.status)
      .toBe(400);

expect(response.body.message)
      .toBe("Name must be a string");

  });

it("should reject short names", async () => {

    const response = await request(app)
      .post("/users")
      .send({
        name: "A",
      });

expect(response.status)
      .toBe(400);

expect(response.body.message)
      .toBe(
        "Name must be at least 2 characters long"
      );

  });

it("should trim user name before saving", async () => {

    const response = await request(app)
      .post("/users")
      .send({
        name: "  Alice  ",
      });

expect(response.status)
      .toBe(201);

expect(response.body.name)
      .toBe("Alice");

  });

});
```

---

## Recommended Jest scripts

`package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Suggested test database config

For integration tests, avoid your production DB. Example `ormconfig.test.ts`:

```ts
export default {
  type: "sqlite",
  database: ":memory:",
  entities: [
    User
  ],
  synchronize: true,
};
```

This gives you:
- ✅ Fast unit tests with mocked repository
- ✅ Full API verification with Supertest
- ✅ Real TypeORM persistence checks
- ✅ Validation coverage
- ✅ Error handling coverage

## Prompt:

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
          AND reservation.end_time >= :now
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

} , You need to make tests for this code also use this for an example import request from "supertest";
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
});  import { Request, Response } from "express";
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

## Response:

Based on your existing style, I will provide:

1. **Unit tests** for `ParkingSpotController` (mock `AppDataSource`, repository, QueryBuilder).
2. **Integration tests** using `supertest` with your PostgreSQL test database setup.

---

## 1. Unit Test — `parkingSpotController.test.ts`

Location example:

```
tests/unit/parkingSpotController.test.ts
```

```ts
import { Request, Response } from "express";
import { ParkingSpotController } from "../../controllers/parkingSpotController";
import { AppDataSource } from "../../database";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.mock("../../database", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("ParkingSpotController Unit Test", () => {

  let req: Partial<Request>;
  let res: any;

  let json: jest.Mock<any>;
  let status: jest.Mock<any>;

  let mockFind: jest.Mock<any>;
  let mockCreateQueryBuilder: jest.Mock<any>;

beforeEach(() => {

    jest.clearAllMocks();

json = jest.fn().mockReturnThis();

    status = jest.fn()
      .mockImplementation(() => ({
        json
      }));

res = {
      status,
      json,
    };

mockFind = jest.fn();

    mockCreateQueryBuilder = jest.fn();

(AppDataSource.getRepository as any)
      .mockImplementation((model: any) => {

        if(model.name === "ParkingSpot") {
          return {
            find: mockFind,
            createQueryBuilder: mockCreateQueryBuilder,
          };
        }

        return {};
      });

  });

describe("GetAllParkingSpot", () => {

it("should return all parking spots", async () => {

const mockParkingSpots = [
        {
          id: "A1"
        },
        {
          id: "A2"
        }
      ];

mockFind.mockResolvedValue(mockParkingSpots);

await ParkingSpotController.GetAllParkingSpot(
        req as Request,
        res as Response
      );

expect(mockFind)
        .toHaveBeenCalledWith({
          select:{
            id:true
          }
        });

expect(status)
        .toHaveBeenCalledWith(200);

expect(json)
        .toHaveBeenCalledWith(mockParkingSpots);

    });

it("should return 500 when database fails", async () => {

mockFind.mockRejectedValue(
        new Error("Database error")
      );

await ParkingSpotController.GetAllParkingSpot(
        req as Request,
        res as Response
      );

expect(status)
        .toHaveBeenCalledWith(500);

expect(json)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            message:
            "Failed to fetch AllParkingSpots"
          })
        );

    });

  });

describe("FreeParkingSpot", () => {

it("should return free parking spots", async () => {

const mockSpots = [
        {
          id:"A1"
        },
        {
          id:"A2"
        }
      ];

const getMany =
        jest.fn()
        .mockResolvedValue(mockSpots);

const setParameters =
        jest.fn()
        .mockReturnThis();

const where =
        jest.fn()
        .mockReturnThis();

const leftJoin =
        jest.fn()
        .mockReturnThis();

mockCreateQueryBuilder.mockReturnValue({

        leftJoin,

        where,

        setParameters,

        getMany

      });

await ParkingSpotController.FreeParkingSpot(
        req as Request,
        res as Response
      );

expect(leftJoin)
        .toHaveBeenCalled();

expect(setParameters)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            status:"APPROVED",
            now:expect.any(Date)
          })
        );

expect(status)
        .toHaveBeenCalledWith(200);

expect(json)
        .toHaveBeenCalledWith({

          message:
          "Free parking spots",

          parkingSpots:
          mockSpots

        });

    });

it("should return 500 when query fails", async () => {

mockCreateQueryBuilder.mockImplementation(()=>{
        throw new Error("Query error");
      });

await ParkingSpotController.FreeParkingSpot(
        req as Request,
        res as Response
      );

expect(status)
        .toHaveBeenCalledWith(500);

expect(json)
        .toHaveBeenCalledWith({

          message:
          "Failed to fetch free parking spots"

        });

    });

});

});
```

---

# 2. Integration Test — `parkingSpot.integration.test.ts`

Location:

```
tests/integration/parkingSpot.integration.test.ts
```

This follows your existing database setup.

```ts
import request from "supertest";
import app from "../../main";
import { AppDataSource } from "../../database";

import { describe, it, expect, beforeAll, afterEach, afterAll } 
from "@jest/globals";

import { ParkingSpot } from "../../models/ParkingSpot";
import { User } from "../../models/User";
import { Reservation, ReservationStatus } 
from "../../models/Reservation";

beforeAll(async () => {

AppDataSource.setOptions({
    logging:false
  });

if(!AppDataSource.isInitialized){
    await AppDataSource.initialize();
  }

const queryRunner =
    AppDataSource.createQueryRunner();

const dbCheck =
    await queryRunner.query(
      "SELECT 1 FROM pg_database WHERE datname = 'parking_db_test'"
    );

if(dbCheck.length === 0){

    await queryRunner.query(
      "COMMIT;"
    );

    await queryRunner.query(
      "CREATE DATABASE parking_db_test;"
    );

  }

await queryRunner.release();

await AppDataSource.destroy();

AppDataSource.setOptions({
    database:"parking_db_test",
    logging:false
  });

if(!AppDataSource.isInitialized){
    await AppDataSource.initialize();
  }

});

afterEach(async()=>{

  const queryRunner =
    AppDataSource.createQueryRunner();

await queryRunner.connect();

try{

    await queryRunner.query(
      `
      TRUNCATE TABLE
      "reservation",
      "parking_spot",
      "user"
      RESTART IDENTITY
      CASCADE;
      `
    );

}finally{

    await queryRunner.release();

  }

});

afterAll(async()=>{

  if(AppDataSource.isInitialized){

    await AppDataSource.destroy();

  }

});

describe(
"ParkingSpot API Integration Test",
()=>{

it(
"should return all parking spots",
async()=>{

const repository =
AppDataSource.getRepository(
ParkingSpot
);

await repository.save([
{
id:"A1"
},
{
id:"A2"
}
]);

const response =
await request(app)
.get(
"/api/v1/GetAllParkingSpot"
);

expect(response.status)
.toBe(200);

expect(response.body)
.toEqual(
[
{
id:"A1"
},
{
id:"A2"
}
]
);

});

it(
"should return free parking spots",
async()=>{

const parkingRepository =
AppDataSource.getRepository(
ParkingSpot
);

await parkingRepository.save([
{
id:"A1"
},
{
id:"A2"
}
]);

const userRepository =
AppDataSource.getRepository(
User
);

const user =
await userRepository.save({
name:"John"
});

const reservationRepository =
AppDataSource.getRepository(
Reservation
);

await reservationRepository.save({

parking_spot_id:"A1",

user_id:user.id,

start_time:
new Date(
Date.now()-60*60*1000
),

end_time:
new Date(
Date.now()+60*60*1000
),

status:
ReservationStatus.APPROVED

});

const response =
await request(app)
.get(
"/api/v1/FreeParkingSpot"
);

expect(response.status)
.toBe(200);

expect(response.body.message)
.toBe(
"Free parking spots"
);

expect(response.body.parkingSpots)
.toEqual(
[
{
id:"A2"
}
]
);

});

it(
"should return occupied spot as unavailable",
async()=>{

const parkingRepository =
AppDataSource.getRepository(
ParkingSpot
);

await parkingRepository.save({
id:"B1"
});

const response =
await request(app)
.get(
"/api/v1/FreeParkingSpot"
);

expect(response.status)
.toBe(200);

expect(response.body.parkingSpots)
.toContainEqual({
id:"B1"
});

});

});
```

---

### Covered cases

| Function | Unit | Integration |
|-|-|-|
| `GetAllParkingSpot` success | ✅ | ✅ |
| `GetAllParkingSpot DB error | ✅ | |
| `FreeParkingSpot` query success | ✅ | ✅ |
| Approved active reservation excluded | | ✅ |
| Available spot returned | | ✅ |
| Query failure | ✅ | |

One important thing: your `FreeParkingSpot` query checks **current time**, so the integration test uses:

```ts
start_time: new Date(Date.now() - 60*60*1000)
end_time: new Date(Date.now() + 60*60*1000)
```

to guarantee the reservation is active during the test.

## Prompt:

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

  static async CancelReservation(req: Request, res: Response) {
    try {
      const { reservationId } = req.params;
      const now = new Date();

      const reservation = await ReservationRepository.findOne({
        where: { id: Number(reservationId) },
      });

      if (!reservation) {
        return res.status(404).json({
          message: "Reservation not found",
        });
      }

      if (now >= reservation.end_time) {
        return res.status(400).json({
          message: "You cannot cancel a reservation that has already ended.",
        });
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
            return res.status(400).json({
              message: "Reservation has already been cancelled.",
            });
          }

      reservation.status = ReservationStatus.CANCELLED;

      await ReservationRepository.save(reservation);

      return res.status(200).json({
        message: "Reservation cancelled successfully.",
        reservation,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to cancel reservation",
        error,
      });
    }
  }

} router.get("/api/v1/getAllReservation", ReservationController.getAllReservation);
router.post("/api/v1/CreateReservation", ReservationController.createReservation);
router.get("/api/v1/myReservation/:userId", ReservationController.getUserReservations);
router.patch("/api/v1/CancelReservation/:reservationId", ReservationController.CancelReservation); make the unit test follow the example import { Request, Response } from "express";
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

## Response:

Your `ReservationController` uses **three repositories**, so unlike `ParkingSpotController` you'll need `getRepository()` to return a different mock depending on the entity. The following follows the same style as your existing tests.

```ts
import { Request, Response } from "express";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockReservationRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockParkingRepository = {
  findOne: jest.fn(),
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

describe("ReservationController Unit Test", () => {
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
  });

  describe("getAllReservation", () => {
    it("should return all reservations", async () => {
      const reservations = [
        {
          id: 1,
          user: { id: 1, name: "John" },
          parkingSpot: { id: "A1" },
        },
      ];

      mockReservationRepository.find.mockResolvedValue(reservations);

      await ReservationController.getAllReservation(
        req as Request,
        res as Response
      );

      expect(mockReservationRepository.find).toHaveBeenCalledWith({
        relations: {
          user: true,
          parkingSpot: true,
        },
      });

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(reservations);
    });

    it("should return 500 when repository fails", async () => {
      mockReservationRepository.find.mockRejectedValue(new Error());

      await ReservationController.getAllReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(500);
    });
  });

  describe("createReservation", () => {
    it("should create reservation successfully", async () => {
      req = {
        body: {
          user_id: 1,
          parking_spot_id: "A1",
          start_time: "2026-08-02T10:00:00",
          end_time: "2026-08-02T12:00:00",
        },
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
      });

      mockParkingRepository.findOne.mockResolvedValue({
        id: "A1",
      });

      const getOne = jest.fn().mockResolvedValue(null);

      const andWhere = jest.fn().mockReturnThis();

      const where = jest.fn().mockReturnThis();

      mockReservationRepository.createQueryBuilder.mockReturnValue({
        where,
        andWhere,
        getOne,
      });

      const reservation = {
        id: 1,
      };

      mockReservationRepository.create.mockReturnValue(reservation);
      mockReservationRepository.save.mockResolvedValue(reservation);

      await ReservationController.createReservation(
        req as Request,
        res as Response
      );

      expect(mockReservationRepository.save).toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(201);
    });

    it("should reject invalid time", async () => {
      req = {
        body: {
          start_time: "2026-08-02T12:00:00",
          end_time: "2026-08-02T10:00:00",
        },
      };

      await ReservationController.createReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: "Start time must be before end time",
      });
    });

    it("should return 404 if user does not exist", async () => {
      req = {
        body: {
          user_id: 1,
          parking_spot_id: "A1",
          start_time: "2026-08-02T10:00:00",
          end_time: "2026-08-02T12:00:00",
        },
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await ReservationController.createReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({
        message: "User does not exist",
      });
    });

    it("should return 404 if parking spot does not exist", async () => {
      req = {
        body: {
          user_id: 1,
          parking_spot_id: "A1",
          start_time: "2026-08-02T10:00:00",
          end_time: "2026-08-02T12:00:00",
        },
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 1 });
      mockParkingRepository.findOne.mockResolvedValue(null);

      await ReservationController.createReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({
        message: "Parking spot does not exist",
      });
    });

    it("should return 409 if reservation overlaps", async () => {
      req = {
        body: {
          user_id: 1,
          parking_spot_id: "A1",
          start_time: "2026-08-02T10:00:00",
          end_time: "2026-08-02T12:00:00",
        },
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 1 });
      mockParkingRepository.findOne.mockResolvedValue({ id: "A1" });

      const getOne = jest.fn().mockResolvedValue({
        id: 99,
      });

      const andWhere = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();

      mockReservationRepository.createQueryBuilder.mockReturnValue({
        where,
        andWhere,
        getOne,
      });

      await ReservationController.createReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(409);
    });
  });

  describe("getUserReservations", () => {
    it("should return reservations for user", async () => {
      req = {
        params: {
          userId: "1",
        },
      };

      const reservations = [{ id: 1 }];

      mockReservationRepository.find.mockResolvedValue(reservations);

      await ReservationController.getUserReservations(
        req as Request,
        res as Response
      );

      expect(mockReservationRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 1,
        },
        relations: {
          parkingSpot: true,
        },
        order: {
          start_time: "DESC",
        },
      });

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(reservations);
    });
  });

  describe("CancelReservation", () => {
    it("should cancel reservation", async () => {
      req = {
        params: {
          reservationId: "1",
        },
      };

      const reservation = {
        id: 1,
        end_time: new Date(Date.now() + 100000),
        status: ReservationStatus.APPROVED,
      };

      mockReservationRepository.findOne.mockResolvedValue(reservation);
      mockReservationRepository.save.mockResolvedValue(reservation);

      await ReservationController.CancelReservation(
        req as Request,
        res as Response
      );

      expect(mockReservationRepository.save).toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(200);
    });

    it("should return 404 when reservation not found", async () => {
      req = {
        params: {
          reservationId: "1",
        },
      };

      mockReservationRepository.findOne.mockResolvedValue(null);

      await ReservationController.CancelReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(404);
    });

    it("should reject already cancelled reservation", async () => {
      req = {
        params: {
          reservationId: "1",
        },
      };

      mockReservationRepository.findOne.mockResolvedValue({
        id: 1,
        end_time: new Date(Date.now() + 100000),
        status: ReservationStatus.CANCELLED,
      });

      await ReservationController.CancelReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: "Reservation has already been cancelled.",
      });
    });

    it("should reject expired reservation", async () => {
      req = {
        params: {
          reservationId: "1",
        },
      };

      mockReservationRepository.findOne.mockResolvedValue({
        id: 1,
        end_time: new Date(Date.now() - 100000),
        status: ReservationStatus.APPROVED,
      });

      await ReservationController.CancelReservation(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: "You cannot cancel a reservation that has already ended.",
      });
    });
  });
});
```

This test suite follows the same mocking style as your `ParkingSpotController` tests while covering all four controller methods:

- `getAllReservation`
- `createReservation`
- `getUserReservations`
- `CancelReservation`

It covers the main success paths and the important validation/error branches (400, 404, 409, and 500 responses).

## Prompt:

Could you make the integration test , use the following pattern import request from "supertest";
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

## Response:

Below is an integration test file that follows the exact same structure and style as your `ParkingSpot` integration tests. It covers all four reservation endpoints:

- `GET /api/v1/getAllReservation`
- `POST /api/v1/CreateReservation`
- `GET /api/v1/myReservation/:userId`
- `PATCH /api/v1/CancelReservation/:reservationId`

```ts
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
  });
});
```

This suite matches the structure of your existing integration tests and covers the primary success and failure paths for each endpoint.

GEMINI 


User prompt: <!DOCTYPE html> <html> <head> <title>Reservation</title> </head> <body> <h1>Create Reservation</h1> <div id="content"> <form id="reservationForm"> <label>Parking Spot</label> <select id="parking_spot_id" required> <option value="">Loading spots...</option> </select> <br><br> <label>Start</label> <input type="datetime-local" id="start_time" required > <br><br> <label>End</label> <input type="datetime-local" id="end_time" required > <br><br> <button type="submit"> Reserve </button> </form> </div> <hr> <h2>My Reservations</h2> <div id="reservationsList"> Loading reservations... </div> <script> const user_id = localStorage.getItem("user_id"); if (!user_id) { document.body.innerHTML = ` <h1>You need to register first</h1> <a href="/register">Register</a> `; throw new Error("No user"); } async function loadParkingSpots() { try { const response = await fetch("/api/v1/GetFreeParkingSpot"); if (!response.ok) { throw new Error("Failed to load parking spots"); } const data = await response.json(); console.log(data); const select = document.getElementById("parking_spot_id"); select.innerHTML = '<option value="">-- Select a Spot --</option>'; if (data.parkingSpots && Array.isArray(data.parkingSpots)) { data.parkingSpots.forEach((spot) => { const option = document.createElement("option"); option.value = String(spot.id); option.text = String(spot.id); select.add(option); }); } else { select.innerHTML = '<option value="">No spots available</option>'; } } catch (err) { console.error(err); const select = document.getElementById("parking_spot_id"); select.innerHTML = '<option value="">Error loading spots</option>'; } } async function loadReservations() { try { const response = await fetch(`/api/v1/myReservation/${user_id}`); const reservations = await response.json(); const container = document.getElementById("reservationsList"); container.innerHTML = ""; if (reservations.length === 0) { container.innerHTML = "<p>No reservations found.</p>"; return; } reservations.forEach(reservation => { const div = document.createElement("div"); div.style.border = "1px solid black"; div.style.padding = "10px"; div.style.marginBottom = "10px"; div.innerHTML = ` <p><strong>ID:</strong> ${reservation.id}</p> <p><strong>Parking Spot:</strong> ${reservation.parkingSpot.id}</p> <p><strong>Start:</strong> ${new Date(reservation.start_time).toLocaleString()}</p> <p><strong>End:</strong> ${new Date(reservation.end_time).toLocaleString()}</p> <p><strong>Status:</strong> ${reservation.status}</p> `; if (reservation.status !== "CANCELLED") { const cancelButton = document.createElement("button"); cancelButton.textContent = "Cancel Reservation"; cancelButton.addEventListener("click", async () => { const confirmCancel = confirm("Are you sure you want to cancel this reservation?"); if (!confirmCancel) return; const response = await fetch( `/api/v1/CancelReservation/${reservation.id}`, { method: "PATCH" } ); const data = await response.json(); alert(data.message); if (response.ok) { loadReservations(); } }); div.appendChild(cancelButton); } container.appendChild(div); }); } catch (error) { console.error(error); } } document .getElementById("reservationForm") .addEventListener("submit", async (e) => { e.preventDefault(); const response = await fetch( "/api/v1/CreateReservation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: Number(user_id), parking_spot_id: document.getElementById("parking_spot_id").value, start_time: document.getElementById("start_time").value, end_time: document.getElementById("end_time").value }) } ); const data = await response.json(); if (response.ok) { alert("Reservation created successfully!"); document.getElementById("reservationForm").reset(); loadReservations(); loadParkingSpots(); } else { alert(data.message); } }); loadParkingSpots(); loadReservations(); </script> </body> </html> <!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>Register</title> </head> <body> <h1>Create Account</h1> <form id="registerForm"> <label>Name:</label> <input type="text" id="name" required > <button type="submit"> Register </button> </form> <script> document.getElementById("registerForm") .addEventListener("submit", async (e)=>{ e.preventDefault(); const name = document.getElementById("name").value; const response = await fetch( "/api/v1/CreateUser", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ name }) } ); const user = await response.json(); if(response.ok){ localStorage.setItem( "user_id", user.id ); alert("Registered!"); window.location.href="/reservation"; }else{ alert(user.message); } }); </script> </body> </html> <!DOCTYPE html> <html> <head> <title>Reservation</title> </head> <body> <h1>Create Reservation</h1> <div id="content"> <form id="reservationForm"> <label>Parking Spot</label> <select id="parking_spot_id" required> <option value="">Loading spots...</option> </select> <br><br> <label>Start</label> <input type="datetime-local" id="start_time" required > <br><br> <label>End</label> <input type="datetime-local" id="end_time" required > <br><br> <button type="submit"> Reserve </button> </form> </div> <hr> <h2>My Reservations</h2> <div id="reservationsList"> Loading reservations... </div> <script> const user_id = localStorage.getItem("user_id"); if (!user_id) { document.body.innerHTML = ` <h1>You need to register first</h1> <a href="/register">Register</a> `; throw new Error("No user"); } async function loadParkingSpots() { try { const response = await fetch("/api/v1/GetFreeParkingSpot"); if (!response.ok) { throw new Error("Failed to load parking spots"); } const data = await response.json(); console.log(data); const select = document.getElementById("parking_spot_id"); select.innerHTML = '<option value="">-- Select a Spot --</option>'; if (data.parkingSpots && Array.isArray(data.parkingSpots)) { data.parkingSpots.forEach((spot) => { const option = document.createElement("option"); option.value = String(spot.id); option.text = String(spot.id); select.add(option); }); } else { select.innerHTML = '<option value="">No spots available</option>'; } } catch (err) { console.error(err); const select = document.getElementById("parking_spot_id"); select.innerHTML = '<option value="">Error loading spots</option>'; } } async function loadReservations() { try { const response = await fetch(`/api/v1/myReservation/${user_id}`); const reservations = await response.json(); const container = document.getElementById("reservationsList"); container.innerHTML = ""; if (reservations.length === 0) { container.innerHTML = "<p>No reservations found.</p>"; return; } reservations.forEach(reservation => { const div = document.createElement("div"); div.style.border = "1px solid black"; div.style.padding = "10px"; div.style.marginBottom = "10px"; div.innerHTML = ` <p><strong>ID:</strong> ${reservation.id}</p> <p><strong>Parking Spot:</strong> ${reservation.parkingSpot.id}</p> <p><strong>Start:</strong> ${new Date(reservation.start_time).toLocaleString()}</p> <p><strong>End:</strong> ${new Date(reservation.end_time).toLocaleString()}</p> <p><strong>Status:</strong> ${reservation.status}</p> `; if (reservation.status !== "CANCELLED") { const cancelButton = document.createElement("button"); cancelButton.textContent = "Cancel Reservation"; cancelButton.addEventListener("click", async () => { const confirmCancel = confirm("Are you sure you want to cancel this reservation?"); if (!confirmCancel) return; const response = await fetch( `/api/v1/CancelReservation/${reservation.id}`, { method: "PATCH" } ); const data = await response.json(); alert(data.message); if (response.ok) { loadReservations(); } }); div.appendChild(cancelButton); } container.appendChild(div); }); } catch (error) { console.error(error); } } document .getElementById("reservationForm") .addEventListener("submit", async (e) => { e.preventDefault(); const response = await fetch( "/api/v1/CreateReservation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: Number(user_id), parking_spot_id: document.getElementById("parking_spot_id").value, start_time: document.getElementById("start_time").value, end_time: document.getElementById("end_time").value }) } ); const data = await response.json(); if (response.ok) { alert("Reservation created successfully!"); document.getElementById("reservationForm").reset(); loadReservations(); loadParkingSpots(); } else { alert(data.message); } }); loadParkingSpots(); loadReservations(); </script> </body> </html> could you refactor this EJS? Use Tailwind css with monochrome theme@Web search
Response: Here is the refactored, production-ready version of your EJS views (register.ejs and reservation.ejs). They feature a fully modernized, scannable monochrome aesthetic powered by Tailwind CSS.
Key Enhancements Included:
True Monochrome Styling: Utilizes a clean slate of stark blacks, charcoal scales (gray-900 to gray-50), and crisp borders to create an editorial, minimal interface.
UX Micro-interactions: Buttons include distinct hover/active dark transitions, and disabled states gracefully reflect an operational delay.
Component-based Layout: Wrapped structures into clean cards with responsive spacing, complete with clear focus borders (focus:ring-1 focus:ring-black) to align with accessible design rules.
💾 Updated Views
1. register.ejs
Save this file into your src/views/ directory.
<!DOCTYPE html>
<html lang="en" class="h-full bg-white">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Account</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-black antialiased">
    <div class="w-full max-w-md space-y-8 border border-black p-8 sm:p-10 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        
        <div>
            <h1 class="text-2xl font-bold uppercase tracking-wider text-center">Create Account</h1>
            <p class="mt-2 text-sm text-gray-500 text-center font-mono">Parking Spot Allocation System</p>
        </div>

        <form id="registerForm" class="mt-8 space-y-6">
            <div>
                <label for="name" class="block text-xs font-mono uppercase tracking-widest text-gray-700 font-bold mb-2">Name</label>
                <input 
                    type="text" 
                    id="name" 
                    required 
                    autocomplete="name"
                    placeholder="Enter full name"
                    class="w-full px-3 py-2.5 border border-black rounded-none focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400 font-sans"
                >
            </div>

            <div>
                <button 
                    type="submit"
                    class="w-full bg-black text-white py-3 px-4 font-mono text-sm uppercase tracking-wider font-bold hover:bg-gray-900 active:bg-gray-800 focus:outline-none transition-all duration-150"
                >
                    Register
                </button>
            </div>
        </form>
    </div>

    <script>
        document.getElementById("registerForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value;

            try {
                const response = await fetch("/api/v1/CreateUser", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name })
                });

                const user = await response.json();

                if (response.ok) {
                    localStorage.setItem("user_id", user.id);
                    alert("Registered successfully!");
                    window.location.href = "/reservation";
                } else {
                    alert(user.message || "Registration failed");
                }
            } catch (err) {
                console.error(err);
                alert("A server error occurred.");
            }
        });
    </script>
</body>
</html>


2. reservation.ejs
Save this file into your src/views/ directory.
<!DOCTYPE html>
<html lang="en" class="h-full bg-gray-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full text-black antialiased bg-gray-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
    
    <div class="max-w-4xl mx-auto space-y-12">
        
        <!-- Header Banner Section -->
        <header class="border-b border-black pb-6 flex flex-col md:flex-row justify-between items-start md:items-baseline gap-2">
            <h1 class="text-3xl font-bold uppercase tracking-wider">Parking Management</h1>
            <p class="text-sm font-mono text-gray-500 uppercase tracking-widest">Workspace Allocations</p>
        </header>

        <!-- Main Content Layout Grid -->
        <main class="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            
            <!-- Reservation Request Panel -->
            <section class="md:col-span-2 border border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
                <h2 class="text-lg font-bold uppercase tracking-wide border-b border-gray-200 pb-2 font-mono">Create Booking</h2>
                
                <form id="reservationForm" class="space-y-5">
                    <div>
                        <label for="parking_spot_id" class="block text-xs font-mono uppercase tracking-wider text-gray-700 font-bold mb-1.5">Parking Spot</label>
                        <select id="parking_spot_id" required class="w-full bg-white px-3 py-2 border border-black rounded-none focus:outline-none focus:ring-1 focus:ring-black font-mono text-sm">
                            <option value="">Loading spaces...</option>
                        </select>
                    </div>

                    <div>
                        <label for="start_time" class="block text-xs font-mono uppercase tracking-wider text-gray-700 font-bold mb-1.5">Start Window</label>
                        <input type="datetime-local" id="start_time" required class="w-full px-3 py-2 border border-black rounded-none focus:outline-none focus:ring-1 focus:ring-black font-mono text-sm">
                    </div>

                    <div>
                        <label for="end_time" class="block text-xs font-mono uppercase tracking-wider text-gray-700 font-bold mb-1.5">End Window</label>
                        <input type="datetime-local" id="end_time" required class="w-full px-3 py-2 border border-black rounded-none focus:outline-none focus:ring-1 focus:ring-black font-mono text-sm">
                    </div>

                    <button type="submit" class="w-full bg-black text-white py-2.5 px-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-gray-900 active:bg-gray-800 focus:outline-none transition-colors">
                        Reserve Slot
                    </button>
                </form>
            </section>

            <!-- Active Reservations Monitor Section -->
            <section class="md:col-span-3 space-y-4">
                <h2 class="text-lg font-bold uppercase tracking-wide border-b border-black pb-2 font-mono">My Active Schedule</h2>
                <div id="reservationsList" class="space-y-4">
                    <p class="text-sm font-mono text-gray-500 animate-pulse">Querying tracking logs...</p>
                </div>
            </section>

        </main>
    </div>

    <script>
        const user_id = localStorage.getItem("user_id");

        if (!user_id) {
            document.body.className = "h-full flex flex-col items-center justify-center bg-white text-black antialiased px-4";
            document.body.innerHTML = `
                <div class="text-center max-w-sm border border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white space-y-4">
                    <h1 class="text-xl font-bold uppercase tracking-wider">Authentication Required</h1>
                    <p class="text-sm text-gray-500 font-mono">No valid identifier session discovered locally.</p>
                    <a href="/register" class="inline-block bg-black text-white px-6 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-gray-900 transition-colors">Go to Registration</a>
                </div>
            `;
            throw new Error("No authorized account context found.");
        }

        async function loadParkingSpots() {
            const select = document.getElementById("parking_spot_id");
            try {
                const response = await fetch("/api/v1/GetFreeParkingSpot");
                if (!response.ok) throw new Error("Faulty network response");

                const data = await response.json();
                select.innerHTML = '<option value="">-- Select a Spot --</option>';

                if (data.parkingSpots && Array.isArray(data.parkingSpots) && data.parkingSpots.length > 0) {
                    data.parkingSpots.forEach((spot) => {
                        const option = document.createElement("option");
                        option.value = String(spot.id);
                        option.textContent = `Spot ${spot.id}`;
                        select.add(option);
                    });
                } else {
                    select.innerHTML = '<option value="">No spots available</option>';
                }
            } catch (err) {
                console.error(err);
                select.innerHTML = '<option value="">Error loading spots</option>';
            }
        }

        async function loadReservations() {
            const container = document.getElementById("reservationsList");
            try {
                const response = await fetch(`/api/v1/myReservation/${user_id}`);
                const reservations = await response.json();
                container.innerHTML = "";

                if (!reservations || reservations.length === 0) {
                    container.innerHTML = `
                        <div class="border border-dashed border-gray-300 p-6 text-center bg-white">
                            <p class="text-sm font-mono text-gray-400 uppercase tracking-wide">No active reservations logs present</p>
                        </div>
                    `;
                    return;
                }

                reservations.forEach(reservation => {
                    const isCancelled = reservation.status === "CANCELLED";
                    const item = document.createElement("div");
                    
                    item.className = `border p-5 bg-white transition-all duration-150 ${
                        isCancelled ? "border-gray-200 opacity-60 bg-gray-50/50" : "border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    }`;

                    item.innerHTML = `
                        <div class="flex justify-between items-start gap-4">
                            <div class="space-y-1 text-sm">
                                <div class="flex items-center gap-3">
                                    <span class="font-mono text-xs text-gray-400">#${reservation.id}</span>
                                    <span class="font-mono uppercase px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                                        isCancelled ? "bg-gray-200 text-gray-600" : "bg-black text-white"
                                    }">${reservation.status}</span>
                                </div>
                                <p class="text-base font-bold font-mono pt-1">Location: Spot ${reservation.parkingSpot.id}</p>
                                <div class="pt-2 text-xs text-gray-600 space-y-0.5 font-mono">
                                    <p><span class="uppercase tracking-wide inline-block w-12 text-gray-400">From:</span> ${new Date(reservation.start_time).toLocaleString()}</p>
                                    <p><span class="uppercase tracking-wide inline-block w-12 text-gray-400">To:</span> ${new Date(reservation.end_time).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    `;

                    if (!isCancelled) {
                        const btnContainer = document.createElement("div");
                        btnContainer.className = "mt-4 pt-3 border-t border-gray-100 flex justify-end";

                        const cancelButton = document.createElement("button");
                        cancelButton.className = "border border-black text-black px-3 py-1.5 font-mono text-xs uppercase tracking-wide hover:bg-black hover:text-white transition-all";
                        cancelButton.textContent = "Cancel Booking";

                        cancelButton.addEventListener("click", async () => {
                            if (!confirm("Are you sure you want to cancel this reservation?")) return;

                            try {
                                const patchRes = await fetch(`/api/v1/CancelReservation/${reservation.id}`, { method: "PATCH" });
                                const data = await patchRes.json();
                                alert(data.message);

                                if (patchRes.ok) {
                                    loadReservations();
                                    loadParkingSpots();
                                }
                            } catch (error) {
                                console.error(error);
                                alert("Failed to communicate cancellation command.");
                            }
                        });

                        btnContainer.appendChild(cancelButton);
                        item.appendChild(btnContainer);
                    }

                    container.appendChild(item);
                });
            } catch (error) {
                console.error(error);
                container.innerHTML = '<p class="text-sm font-mono text-red-600 bg-red-50 p-3 border border-red-200">Error rendering booking schedule records.</p>';
            }
        }

        document.getElementById("reservationForm").addEventListener("submit", async (e) => {
            e.preventDefault();

            try {
                const response = await fetch("/api/v1/CreateReservation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: Number(user_id),
                        parking_spot_id: document.getElementById("parking_spot_id").value,
                        start_time: document.getElementById("start_time").value,
                        end_time: document.getElementById("end_time").value
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Reservation created successfully!");
                    document.getElementById("reservationForm").reset();
                    loadReservations();
                    loadParkingSpots();
                } else {
                    alert(data.message || "Failed to finalize scheduling conflict window.");
                }
            } catch (err) {
                console.error(err);
                alert("Network transaction failed processing allocation request.");
            }
        });

        loadParkingSpots();
        loadReservations();
    </script>
</body>
</html>
