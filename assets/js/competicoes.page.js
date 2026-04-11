import { loadSharedComponents } from "./components.js";
import { initEventsUi } from "./main.js";

async function bootstrap() {
  await loadSharedComponents();
  await initEventsUi();
}

bootstrap();
