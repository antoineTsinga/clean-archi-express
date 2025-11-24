import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("projects")
export class ProjectEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  description!: string;

  @Column("varchar")
  userId!: string;
}
