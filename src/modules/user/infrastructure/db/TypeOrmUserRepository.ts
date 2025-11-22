
import { IUserRepository } from "@modules/user/domain/IUserRepository.js";

import { AppDataSource } from "@/infrastructure/db/db.js";
import { UserEntity } from "./UserEntity.js";
import { User } from "@modules/user/domain/User.js";

export class TypeOrmUserRepository implements IUserRepository {
  private repository = AppDataSource.getRepository(UserEntity);

  async save(user: User): Promise<User> {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.name = user.name;
    entity.email = user.email;

    const savedEntity = await this.repository.save(entity);
    return new User(savedEntity.id, savedEntity.name, savedEntity.email);
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({ email });
    if (!entity) return null;
    return new User(entity.id, entity.name, entity.email);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    return new User(entity.id, entity.name, entity.email);
  }
}
