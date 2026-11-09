export type ApiErrorCode =
  | "SESSION_REVOKED"
  | "REFRESH_INVALID"
  | "FEATURE_REQUIRED"
  | (string & {});

export class ApiError extends Error {
  status: number;
  code?: ApiErrorCode;
  /** Extra fields from the error body, e.g. `feature` and `upgradeHint`. */
  details: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    code?: ApiErrorCode,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isSessionRevoked(err: unknown): boolean {
  return err instanceof ApiError && err.code === "SESSION_REVOKED";
}
