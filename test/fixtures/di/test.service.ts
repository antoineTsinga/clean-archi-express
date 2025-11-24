import { injectable, registry } from "tsyringe";

export const TEST_TOKENS = {
  ITestService2: Symbol.for("ITestService2"),
  tokenTestService2: Symbol.for("tokenTestService2"),
};

@injectable()
export class TestService {
  getName() {
    return "TestService";
  }
}

export class TestService2 implements ITestService2 {
  getName() {
    return "TestService2";
  }
}

export interface ITestService2 {
  getName(): string;
}

@registry([
  { token: TestService, useClass: TestService },
  { token: TEST_TOKENS.ITestService2, useClass: TestService2 },
  { token: TestService2, useFactory: () => new TestService2() },
  { token: "testfactory", useFactory: () => 4 },
  { token: TestService2, useValue: new TestService2().getName() },
  { token: "tokenTestService2", useToken: "TOKEN_TestService2" },
  { token: "TOKEN_TestService2", useValue: "TOKEN_TestService2" },
  { token: "tokenTestService2", useToken: TestService2 },
])
export class TestRegistry {}
