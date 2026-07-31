import { Entity, PrimaryColumn, OneToMany } from "typeorm";
import { Reservation } from "./Reservation";

@Entity()
export class ParkingSpot {
  @PrimaryColumn()
  id!: string;

  @OneToMany(() => Reservation, (reservation) => reservation.parkingSpot)
  reservations!: Reservation[];
}
