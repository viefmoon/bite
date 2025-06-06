import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UploadTimeoutMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Aumentar timeout para rutas de upload
    if (req.path.includes('/upload')) {
      // Timeout de 5 minutos para uploads
      req.setTimeout(300000);
      res.setTimeout(300000);

      console.log(
        `[UploadMiddleware] Extended timeout for upload request: ${req.path}`,
      );
    }

    next();
  }
}
