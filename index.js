import QRCodeStyling from "qr-code-styling";

const DEBOUNCE_MS = 1000;

const dataInput = document.getElementById("data");
const logoInput = document.getElementById("logo");
const uploadArea = document.getElementById("uploadArea");
const uploadText = document.getElementById("uploadText");
const clearLogoBtn = document.getElementById("clearLogo");
const canvasEl = document.getElementById("canvas");
const spinnerEl = document.getElementById("spinner");
const downloadBtn = document.getElementById("downloadQr");
const dotColor = document.getElementById("dotColor");
const bgColor = document.getElementById("bgColor");
const dotType = document.getElementById("dotType");
const cornerType = document.getElementById("cornerType");
const shape = document.getElementById("shape");
const sizeInput = document.getElementById("size");
const marginInput = document.getElementById("margin");

const STORAGE_KEY = "qrcode-gen-settings";

let debounceTimer = null;
let logoDataUrl = null;
let logoFileName = null;

function saveSettings() {
  const settings = {
    data: dataInput.value,
    dotColor: dotColor.value,
    bgColor: bgColor.value,
    dotType: dotType.value,
    cornerType: cornerType.value,
    shape: shape.value,
    size: sizeInput.value,
    margin: marginInput.value,
    logoDataUrl,
    logoFileName,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Could not save settings:", e);
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.data != null) dataInput.value = s.data;
    if (s.dotColor) dotColor.value = s.dotColor;
    if (s.bgColor) bgColor.value = s.bgColor;
    if (s.dotType) dotType.value = s.dotType;
    if (s.cornerType) cornerType.value = s.cornerType;
    if (s.shape) shape.value = s.shape;
    if (s.size) sizeInput.value = s.size;
    if (s.margin != null) marginInput.value = s.margin;
    if (s.logoDataUrl) {
      logoDataUrl = s.logoDataUrl;
      logoFileName = s.logoFileName || "logo";
      uploadText.textContent = logoFileName;
      clearLogoBtn.hidden = false;
    }
  } catch (e) {
    console.warn("Could not load settings:", e);
  }
}

const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  type: "canvas",
  data: "",
  dotsOptions: { color: "#0c4a6e", type: "rounded" },
  backgroundOptions: { color: "#e0f2fe" },
  cornersSquareOptions: { type: "square", color: "#0c4a6e" },
  cornersDotOptions: { type: "square", color: "#0c4a6e" },
  imageOptions: { crossOrigin: "anonymous", margin: 10 },
  qrOptions: { errorCorrectionLevel: "H" },
});

function debounce(fn, ms) {
  return function run(...args) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      fn.apply(this, args);
    }, ms);
  };
}

function getOptions() {
  const size = Math.min(600, Math.max(200, Number(sizeInput.value) || 300));
  const margin = Math.min(50, Math.max(0, Number(marginInput.value) ?? 10));
  const cornerOpts = { type: cornerType.value, color: dotColor.value };
  return {
    width: size,
    height: size,
    margin,
    data: dataInput.value.trim() || " ",
    image: logoDataUrl || undefined,
    shape: shape.value,
    dotsOptions: { type: dotType.value, color: dotColor.value },
    backgroundOptions: { color: bgColor.value },
    cornersSquareOptions: cornerOpts,
    cornersDotOptions: cornerOpts,
    imageOptions: { crossOrigin: "anonymous", margin: 12 },
  };
}

function render() {
  spinnerEl.hidden = true;
  qrCode.update(getOptions());
  saveSettings();
}

const debouncedRender = debounce(render, DEBOUNCE_MS);

function readLogoFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    logoDataUrl = e.target.result;
    logoFileName = file.name;
    uploadText.textContent = file.name;
    clearLogoBtn.hidden = false;
    render();
  };
  reader.readAsDataURL(file);
}

uploadArea.addEventListener("click", (e) => {
  if (e.target === clearLogoBtn) return;
  logoInput.click();
});

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) readLogoFile(file);
});

logoInput.addEventListener("change", () => {
  const file = logoInput.files[0];
  if (file) readLogoFile(file);
});

clearLogoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  logoDataUrl = null;
  logoFileName = null;
  logoInput.value = "";
  uploadText.textContent = "Drop image or click to upload";
  clearLogoBtn.hidden = true;
  render();
});

function onDataInput() {
  spinnerEl.hidden = false;
  debouncedRender();
}
dataInput.addEventListener("input", onDataInput);
dataInput.addEventListener("paste", onDataInput);

[dotColor, bgColor, dotType, cornerType, shape, sizeInput, marginInput].forEach((el) => {
  el.addEventListener("change", render);
  el.addEventListener("input", render);
});

downloadBtn.addEventListener("click", () => {
  qrCode.download({ name: "qr-code", extension: "png" });
});

loadSettings();
qrCode.append(canvasEl);
render();
