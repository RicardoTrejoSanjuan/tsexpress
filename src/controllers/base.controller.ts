import { AuthRequest } from '../interfaces/auth.request';
import { AuthMiddleware } from './../middlewares/auth.middleware';
import { ValidationHandler } from './../handlers/validation.handler';
import { isNullOrWhitespace } from './../helpers/string.helper';
import { DevError } from './../errors/dev.error';
import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { injectable, inject } from 'inversify';
import { Validator } from "class-validator";
import PromiseRouter from "express-promise-router";

@injectable()
export abstract class BaseController {
  @inject(AuthMiddleware) private readonly authMiddleware: AuthMiddleware;
  @inject(ValidationHandler) protected readonly validator: ValidationHandler;

  public readonly path: string;
  public readonly router: Router;

  public abstract initializeRoutes(): void;

  constructor(path: string = '', addAuth: boolean = true) {
    if (isNullOrWhitespace(path)) {
      throw new DevError(`Parameter 'path' can not be empty.`);
    }

    this.router = PromiseRouter();
    this.path = path;

    if (addAuth) {
      this.router
        .all(this.path, this.authenticate())
        .all(`${this.path}/*`, this.authenticate());
    }
  }

  protected getBoolFromQuery(request: Request, query: string): boolean {
    let boolValue = request.query[query] || "false";
    boolValue = new Validator().isBooleanString(boolValue) && (boolValue.toLowerCase() === "true" || boolValue === "1");
    return boolValue;
  }

  private authenticate(): RequestHandler {
    return (request: AuthRequest, response: Response, next: NextFunction) => {
      this.authMiddleware.handle(request, response, next);
    };
  }
}
