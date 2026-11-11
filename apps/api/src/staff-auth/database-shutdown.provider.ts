import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { db } from "@talkvyn/database";

@Injectable()
export class DatabaseShutdownProvider implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await db.close();
  }
}
