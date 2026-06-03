import fs from "node:fs";

const tauriPath = "src-tauri/tauri.conf.json";
const tauri = JSON.parse(fs.readFileSync(tauriPath, "utf8"));

tauri.bundle ??= {};
tauri.bundle.linux ??= {};
tauri.bundle.linux.deb ??= {};

const audioDepends = [
  "gstreamer1.0-plugins-base",
  "gstreamer1.0-plugins-good",
  "gstreamer1.0-libav",
  "gstreamer1.0-pipewire",
  "gstreamer1.0-pulseaudio"
];

const currentDepends = Array.isArray(tauri.bundle.linux.deb.depends)
  ? tauri.bundle.linux.deb.depends
  : [];

tauri.bundle.linux.deb.depends = [...new Set([...currentDepends, ...audioDepends])].sort();

fs.writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`, "utf8");

console.log("Patched Linux .deb audio dependencies:");
console.log(tauri.bundle.linux.deb.depends.join("\n"));
