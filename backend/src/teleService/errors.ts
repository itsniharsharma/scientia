export class UploadValidationError extends Error {
  readonly name = 'UploadValidationError';
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, UploadValidationError.prototype);
  }
}

export class UploadImageError extends Error {
  readonly name = 'UploadImageError';
  constructor(message: string, readonly cause?: Error) {
    super(message);
    Object.setPrototypeOf(this, UploadImageError.prototype);
  }
}

export class UploadCloudinaryError extends Error {
  readonly name = 'UploadCloudinaryError';
  constructor(message: string, readonly cause?: Error) {
    super(message);
    Object.setPrototypeOf(this, UploadCloudinaryError.prototype);
  }
}

export class UploadDatabaseError extends Error {
  readonly name = 'UploadDatabaseError';
  constructor(message: string, readonly cause?: Error) {
    super(message);
    Object.setPrototypeOf(this, UploadDatabaseError.prototype);
  }
}
