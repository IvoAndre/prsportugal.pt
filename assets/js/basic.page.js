import { loadSharedComponents } from "./components.js";
import { refreshGoogleTranslate } from "./translate.js";

async function bootstrap() {
  await loadSharedComponents();
  refreshGoogleTranslate({ delay: 250 });
}

bootstrap();
