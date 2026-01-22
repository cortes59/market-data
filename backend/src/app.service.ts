import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot(): { message: string } {
    return {
      message: 'Market Data Platform API - Server is running',
    };
  }
}
