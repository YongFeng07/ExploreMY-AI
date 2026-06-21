import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => {
      if (data && typeof data === 'object' && 'data' in data) {
        return { ...data, requestId: randomUUID() };
      }
      return { data, requestId: randomUUID() };
    }));
  }
}
