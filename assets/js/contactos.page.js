import { loadSharedComponents } from "./components.js";

function initContactForm() {
  const form = document.getElementById("contact-form");
  const feedback = document.getElementById("form-feedback");

  if (!form || !feedback) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      feedback.textContent = "Preenche todos os campos obrigatorios antes de enviar.";
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();

    const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\n${message}`);
    const mailto = `mailto:geral@prsportugal.pt?subject=${encodeURIComponent(subject)}&body=${body}`;

    window.location.href = mailto;
    feedback.textContent = "A abrir o teu cliente de email para concluir o envio.";
  });
}

async function bootstrap() {
  await loadSharedComponents();
  initContactForm();
}

bootstrap();
