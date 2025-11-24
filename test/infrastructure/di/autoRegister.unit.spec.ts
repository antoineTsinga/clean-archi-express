import "reflect-metadata";
import { describe, it, expect } from "vitest";
import {
  formatToken,
  formatProviderKind,
  getClassName,
  introspectFactoryReturnTypeName,
} from "@/infrastructure/di/autoRegister.js";

describe("autoRegister helpers", () => {
  describe("formatToken", () => {
    it("should format string token", () => {
      expect(formatToken("myToken")).toBe('token "myToken"');
    });

    it("should format symbol token", () => {
      expect(formatToken(Symbol("mySymbol"))).toBe("Symbol(mySymbol)");
    });

    it("should format class token", () => {
      class MyClass {}
      expect(formatToken(MyClass)).toBe("class MyClass");
    });

    it("should format other token types", () => {
      expect(formatToken(123)).toBe("123");
    });
  });

  describe("formatProviderKind", () => {
    it("should format class kind", () => {
      expect(formatProviderKind("class")).toBe("useClass");
    });

    it("should format value kind", () => {
      expect(formatProviderKind("value")).toBe("useValue");
    });

    it("should format factory kind", () => {
      expect(formatProviderKind("factory")).toBe("useFactory");
    });

    it("should format token kind", () => {
      expect(formatProviderKind("token")).toBe("useToken");
    });

    it("should format unknown kind", () => {
      expect(formatProviderKind("unknown" as any)).toBe("unknown");
    });
  });

  describe("getClassName", () => {
    it("should get name from useClass", () => {
      class MyClass {}
      expect(getClassName({ useClass: MyClass })).toBe("MyClass");
    });

    it("should handle anonymous class in useClass", () => {
      // In some JS engines, class assigned to property gets the property name
      expect(getClassName({ useClass: class {} })).toMatch(/anonymous|useClass/);
    });

    it("should get name from useValue (object)", () => {
      class MyValue {}
      expect(getClassName({ useValue: new MyValue() })).toBe("MyValue");
    });

    it("should get type from useValue (primitive)", () => {
      expect(getClassName({ useValue: 123 })).toBe("number");
    });

    it("should handle null useValue", () => {
      expect(getClassName({ useValue: null })).toBe("null");
    });

    it("should get name from useFactory", () => {
      function myFactory() {
        return 1;
      }
      expect(getClassName({ useFactory: myFactory })).toBe("Number");
    });

    it("should handle anonymous factory", () => {
      expect(getClassName({ useFactory: () => 1 })).toBe("Number");
    });
    it("should handle factory returning object", () => {
      class Result {}
      expect(getClassName({ useFactory: () => new Result() })).toBe("Result");
    });

    it("should handle factory throwing error", () => {
      const throwingFactory = () => {
        throw new Error();
      };
      expect(getClassName({ useFactory: throwingFactory })).toBe("factory(throwingFactory)");
    });

    it("should handle useToken with string", () => {
      expect(getClassName({ useToken: "token" })).toBe('token("token")');
    });

    it("should handle useToken with class", () => {
      class MyClass {}
      expect(getClassName({ useToken: MyClass })).toBe("token(class MyClass)");
    });

    it("should handle useToken with symbol", () => {
      expect(getClassName({ useToken: Symbol("sym") })).toBe("token(Symbol(sym))");
    });

    it("should handle useToken with other", () => {
      expect(getClassName({ useToken: 123 })).toBe("token");
    });

    it("should return undefined for unknown provider", () => {
      expect(getClassName({})).toBeUndefined();
    });
  });

  describe("introspectFactoryReturnTypeName", () => {
    it("should return constructor name of factory result", () => {
      class Result {}
      expect(introspectFactoryReturnTypeName(() => new Result())).toBe("Result");
    });

    it("should return factory name if result is null/undefined", () => {
      function myFactory() {
        return null;
      }
      expect(introspectFactoryReturnTypeName(myFactory)).toBe("factory(myFactory)");
    });

    it("should return factory name if factory throws", () => {
      function throwingFactory() {
        throw new Error();
      }
      expect(introspectFactoryReturnTypeName(throwingFactory)).toBe("factory(throwingFactory)");
    });
  });
});
