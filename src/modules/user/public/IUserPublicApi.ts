export interface UserPublicDto {
  id: string;
  name: string;
  email: string;
}

export interface IUserPublicApi {
  getUserById(id: string): Promise<UserPublicDto | null>;
}
