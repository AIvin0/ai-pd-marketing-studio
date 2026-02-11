import { $ } from "./dom.js";

export function openModal(finalUrl, hashtags) {
  const modal = $("#resultModal");
  const player = $("#finalVideoPlayer");
  const source = player.querySelector("source");
  source.src = finalUrl;
  player.load();

  $("#finalHashtags").innerText = hashtags || "#영상제작완료";
  modal.style.display = "flex";
}

export function closeModal() {
  $("#resultModal").style.display = "none";
}

export function copyHashtags() {
  const tags = $("#finalHashtags")?.innerText || "";
  navigator.clipboard.writeText(tags).then(() => alert("해시태그를 복사했습니다."));
}
