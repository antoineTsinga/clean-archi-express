import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("users")
export class UserEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { unique: true })
  email!: string;
}
