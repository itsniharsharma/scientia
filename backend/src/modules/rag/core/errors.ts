import { AppError } from '../../../shared/errors';

// Reuses the existing AppError base (shared/errors.ts) so RAG errors flow
// through the same errorHandler middleware as the rest of the API, instead
// of introducing a parallel error-handling convention.

export class InvalidDocumentError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'InvalidDocumentError';
  }
}

export class ParseError extends AppError {
  constructor(message: string) {
    super(422, message);
    this.name = 'ParseError';
  }
}

// The detailed `message` these three carry can include upstream provider
// text (raw HTTP error bodies from Voyage/Qdrant/Gemini — quota metrics,
// account/billing links, request internals). That's exactly what an
// operator needs in logs, and exactly what an end user must never see in an
// API response — it exposes which third-party providers back the system and
// their account/quota state. So the client-facing message is a safe,
// generic one; the real detail travels as `cause` for errorHandler to log.
const UPSTREAM_UNAVAILABLE_MESSAGE = 'The Scientia Helpdesk is temporarily unavailable. Please try again shortly.';

export class EmbeddingError extends AppError {
  constructor(detail: string) {
    super(502, UPSTREAM_UNAVAILABLE_MESSAGE, { cause: detail });
    this.name = 'EmbeddingError';
  }
}

export class VectorStoreError extends AppError {
  constructor(detail: string) {
    super(502, UPSTREAM_UNAVAILABLE_MESSAGE, { cause: detail });
    this.name = 'VectorStoreError';
  }
}

export class GenerationError extends AppError {
  constructor(detail: string) {
    super(502, UPSTREAM_UNAVAILABLE_MESSAGE, { cause: detail });
    this.name = 'GenerationError';
  }
}

export class ConfigurationError extends AppError {
  constructor(detail: string) {
    super(500, UPSTREAM_UNAVAILABLE_MESSAGE, { cause: detail });
    this.name = 'ConfigurationError';
  }
}
