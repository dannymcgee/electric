import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app/app.module";

const GLOBAL_PREFIX = "api";
const PORT = process.env.PORT ?? 3333;

async function bootstrap() {
	(await NestFactory.create(AppModule))
		.setGlobalPrefix(GLOBAL_PREFIX)
		.listen(PORT);

	Logger.log(`🚀 Application is running on: http://localhost:${PORT}/${GLOBAL_PREFIX}`);
}

bootstrap();
