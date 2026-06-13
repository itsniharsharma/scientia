import { Injectable } from '@nestjs/common';
import { getEnv, type Env } from '@scientia/config';

@Injectable()
export class AppConfigService {
  private readonly env: Env = getEnv();

  get<K extends keyof Env>(key: K): Env[K] {
    return this.env[key];
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }
}
