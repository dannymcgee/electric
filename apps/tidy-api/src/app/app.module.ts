import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { FileSystemService } from "./fs.service";

@Module({
	imports: [],
	controllers: [AppController],
	providers: [FileSystemService],
})
export class AppModule {}
