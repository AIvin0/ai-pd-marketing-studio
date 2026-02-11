import { $ } from "./dom.js";

export function showLoader(text) {
  $("#loader").style.display = "block";
  if (text) $("#loading-text").innerText = text;
}

export function hideLoader() {
  $("#loader").style.display = "none";
}

export function resetUI() {
  $("#productFile").value = "";
  $("#characterFile").value = "";
  $("#userRequest").value = "";

  $("#planDisplay").innerHTML = "";
  $("#productionDisplay").innerHTML = "";
  $("#finalResultDisplay").innerHTML = "";

  hideLoader();
}
