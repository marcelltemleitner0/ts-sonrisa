import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { User } from "../models/User";


export class UserController {

  static async createUser(req: Request, res: Response) {
    try {
        const userRepository = AppDataSource.getRepository(User);
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
