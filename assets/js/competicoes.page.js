import { loadSharedComponents } from "./components.js";
import { initEventsUi } from "./main.js";
import { initAnnualResultsUi } from "./results.js";

async function bootstrap() {
  await loadSharedComponents();
  await initEventsUi({ showTrainingsInCalendar: true });
  await initAnnualResultsUi();
}

bootstrap();
