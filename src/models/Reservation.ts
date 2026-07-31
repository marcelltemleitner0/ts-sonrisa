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
  id!: number;

  @Column()
  parking_spot_id!: string;

  @Column()
  user_id!: number;

  @Column({ type: "timestamp" })
  start_time!: Date;

  @Column({ type: "timestamp" })
  end_time!: Date;

  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.APPROVED,
  })
  status!: ReservationStatus;

  @ManyToOne(() => ParkingSpot, (parkingSpot) => parkingSpot.reservations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parking_spot_id" })
  parkingSpot!: ParkingSpot;

  @ManyToOne(() => User, (user) => user.reservations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
