import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "@/core/errors/AppError.js";

/**
 * Extension du type Request pour inclure les infos d'authentification
 * injectées par un middleware en amont (ex: JWT, session...).
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    subject?: string;
    [key: string]: unknown;
  };
}

export type Predicate = (req: AuthenticatedRequest) => boolean;

export const isAuthenticated: Predicate = (req) => Boolean(req.auth?.subject);

export class SecurityError extends AppError {
  constructor(message: string, statusCode: number, code: string) {
    super(message, statusCode, code);
  }
}

interface Rule {
  route: string;
  predicates: Predicate[];
}

export interface SecurityConfig {
  rules: Rule[];
  middlewares: RequestHandler[];
  /**
   * Si true, toute route sans règle explicite sera interdite.
   * Par défaut: false (tout ce qui n'est pas configuré est autorisé).
   */
  defaultDeny?: boolean;
}

export class SecurityFilterChain {
  constructor(private readonly config: SecurityConfig) {}

  /**
   * Expose le middleware Express final.
   */
  public getMiddleware(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.runMiddlewares(req, res);

        // Un middleware précédent a peut-être déjà répondu
        if (res.headersSent) {
          return;
        }

        const authReq = req as AuthenticatedRequest;
        const matchedRule = this.getMostSpecificRule(authReq.path);

        if (matchedRule) {
          const authorized = matchedRule.predicates.every((p) => p(authReq));
          if (!authorized) {
            throw new SecurityError("Forbidden", 403, "FORBIDDEN");
          }
        } else if (this.config.defaultDeny) {
          // Stratégie "deny all" si aucune règle ne matche
          throw new SecurityError("Forbidden", 403, "FORBIDDEN");
        }

        next();
      } catch (err) {
        next(err);
      }
    };
  }

  /**
   * Exécute les middlewares configurés séquentiellement.
   * Arrête si la réponse est déjà envoyée.
   */
  private async runMiddlewares(req: Request, res: Response): Promise<void> {
    for (const middleware of this.config.middlewares) {
      if (res.headersSent) return;

      await new Promise<void>((resolve, reject) => {
        let called = false;

        middleware(req, res, (err?: any) => {
          // Sécurité en cas de middleware mal foutu appelant next() plusieurs fois
          if (called) return;
          called = true;

          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /**
   * Retourne la règle la plus spécifique correspondant au path:
   * - correspondance exacte ("/api" === "/api")
   * - préfixe avec séparateur ("/api" matche "/api/users" mais pas "/api-legacy")
   * - possibilité d'une règle catch-all sur "/"
   */
  private getMostSpecificRule(path: string): Rule | undefined {
    const candidates = this.config.rules.filter((rule) => {
      if (rule.route === "/") return true;
      if (path === rule.route) return true;

      const normalized = rule.route.endsWith("/") ? rule.route : rule.route + "/";

      return path.startsWith(normalized);
    });

    if (candidates.length === 0) {
      return undefined;
    }

    // La route la plus longue est considérée comme la plus spécifique
    return candidates.sort((a, b) => b.route.length - a.route.length)[0];
  }
}

export class HttpSecurityBuilder {
  private rules: Rule[] = [];
  private middlewares: RequestHandler[] = [];
  private defaultDeny = false;

  constructor(options?: { defaultDeny?: boolean }) {
    if (options?.defaultDeny) {
      this.defaultDeny = true;
    }
  }

  public authorizeHttpRequests(config: (auth: AuthorizationManager) => void): this {
    const manager = new AuthorizationManager();
    config(manager);
    this.rules.push(...manager.getRules());
    return this;
  }

  public addFilterBefore(middleware: RequestHandler): this {
    this.middlewares.unshift(middleware);
    return this;
  }

  public addFilterAfter(middleware: RequestHandler): this {
    this.middlewares.push(middleware);
    return this;
  }

  public addFilter(middleware: RequestHandler): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Active explicitement une stratégie "deny all" pour les routes non configurées.
   */
  public denyAllByDefault(): this {
    this.defaultDeny = true;
    return this;
  }

  public build(): SecurityFilterChain {
    return new SecurityFilterChain({
      rules: [...this.rules],
      middlewares: [...this.middlewares],
      defaultDeny: this.defaultDeny,
    });
  }
}

export class AuthorizationManager {
  private rules: Rule[] = [];

  public requestMatchers(route: string): RequestMatcher {
    return new RequestMatcher(route, this);
  }

  public addRule(route: string, predicates: Predicate[]) {
    this.rules.push({ route, predicates });
  }

  public getRules(): Rule[] {
    return [...this.rules];
  }
}

export class RequestMatcher {
  constructor(
    private readonly route: string,
    private readonly manager: AuthorizationManager
  ) {}

  /**
   * Route autorisée sans condition.
   */
  public permitAll(): void {
    this.manager.addRule(this.route, [() => true]);
  }

  /**
   * Route réservée aux utilisateurs authentifiés.
   */
  public authenticated(): void {
    this.manager.addRule(this.route, [isAuthenticated]);
  }

  /**
   * Route soumise à une ou plusieurs prédicats personnalisés.
   * Tous doivent retourner true (AND logique).
   */
  public access(...predicates: Predicate[]): void {
    this.manager.addRule(this.route, predicates);
  }
}
