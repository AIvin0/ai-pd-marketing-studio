import { $$ } from "./dom.js";

export function showSection(sectionId) {
  $$(".step-section").forEach((el) => el.classList.remove("active"));
  document.getElementById(sectionId)?.classList.add("active");
  window.scrollTo(0, 0);
}
