export interface IGreetUser {
  execute(userId: string): Promise<string>;
}
