import QRCodeStyling from "qr-code-styling";

const DEBOUNCE_MS = 1000;
const STORAGE_CONTENT_KEY = "qrcode-gen-content";
const STORAGE_PRESET_KEY = "qrcode-gen-preset";

const PRESETS = {
  ecsess: {
    title: "ECSESS QR Code Generator",
    dotColor: "#2d6244",
    bgColor: "#fafffd",
    logo: "./ECSESSLogo.png",
    pageBg:
      "linear-gradient(160deg, #0d2818 0%, #1b4332 40%,rgb(14, 79, 52) 100%)",
    pageColor: "#d8f3dc",
    panelBg: "rgba(255, 255, 255, 0.97)",
    border: "#95d5b2",
    accent: "#2d6a4f",
  },
  thefactory: {
    title: "The Factory QR Code Generator",
    dotColor: "#57a282",
    bgColor: "#f5fffb",
    logo: "./TheFactoryLogo.png",
    pageBg:
      "linear-gradient(160deg,rgb(6, 62, 44) 0%, rgb(27, 73, 48) 40%, rgb(26, 85, 61)100%)",
    pageColor: "#ccfbf1",
    panelBg: "rgba(255, 255, 255, 0.97)",
    border: "#5eead4",
    accent: "#0f766e",
  },
  codejam: {
    title: "Code.Jam() QR Code Generator",
    dotColor: "#629cc0",
    bgColor: "#ffffff",
    logo: "./CodeJamLogo.svg",
    pageBg: "linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    pageColor: "#e0e7ff",
    panelBg: "rgba(255, 255, 255, 0.97)",
    border: "#818cf8",
    accent: "#4338ca",
  },
};

const dataInput = document.getElementById("data");
const presetEl = document.getElementById("preset");
const canvasEl = document.getElementById("canvas");
const spinnerEl = document.getElementById("spinner");
const downloadBtn = document.getElementById("downloadQr");
const dotColor = document.getElementById("dotColor");
const bgColor = document.getElementById("bgColor");
const dotType = document.getElementById("dotType");
const cornerType = document.getElementById("cornerType");
const sizeInput = document.getElementById("size");
const marginInput = document.getElementById("margin");

let debounceTimer = null;

const qrCode = new QRCodeStyling({
  width: 1000,
  height: 1000,
  type: "canvas",
  data: "",
  dotsOptions: { color: "#1b4332", type: "rounded" },
  backgroundOptions: { color: "#ffffff" },
  cornersSquareOptions: { type: "extra-rounded", color: "#1b4332" },
  cornersDotOptions: { type: "extra-rounded", color: "#1b4332" },
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
  const size = Math.min(2000, Math.max(200, Number(sizeInput.value) || 1000));
  const margin = Math.min(50, Math.max(0, Number(marginInput.value) ?? 20));
  const cornerOpts = { type: cornerType.value, color: dotColor.value };
  const preset = PRESETS[presetEl.value];
  const logoPath = preset ? preset.logo : null;
  return {
    width: size,
    height: size,
    margin,
    data: dataInput.value.trim() || " ",
    image: logoPath || undefined,
    shape: "square",
    dotsOptions: { type: dotType.value, color: dotColor.value },
    backgroundOptions: { color: bgColor.value },
    cornersSquareOptions: cornerOpts,
    cornersDotOptions: cornerOpts,
    imageOptions: { crossOrigin: "anonymous", margin: 12 },
  };
}

const pageTitleEl = document.getElementById("pageTitle");

function applyTheme(preset) {
  if (!preset) return;
  const root = document.documentElement;
  root.style.setProperty("--page-bg", preset.pageBg);
  root.style.setProperty("--page-color", preset.pageColor);
  root.style.setProperty("--panel-bg", preset.panelBg);
  root.style.setProperty("--page-border", preset.border);
  root.style.setProperty("--page-accent", preset.accent);
  if (pageTitleEl) pageTitleEl.textContent = preset.title;
}

function applyPreset() {
  const preset = PRESETS[presetEl.value];
  if (preset) {
    dotColor.value = preset.dotColor;
    bgColor.value = preset.bgColor;
    applyTheme(preset);
  }
  render();
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_CONTENT_KEY, dataInput.value);
    localStorage.setItem(STORAGE_PRESET_KEY, presetEl.value);
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

function loadFromStorage() {
  try {
    const content = localStorage.getItem(STORAGE_CONTENT_KEY);
    if (content != null) dataInput.value = content;
    const preset = localStorage.getItem(STORAGE_PRESET_KEY);
    if (preset && PRESETS[preset]) {
      presetEl.value = preset;
      const p = PRESETS[preset];
      dotColor.value = p.dotColor;
      bgColor.value = p.bgColor;
    }
  } catch (e) {
    console.warn("Could not load from localStorage:", e);
  }
  setActivePresetButton();
  const p = PRESETS[presetEl.value];
  if (p) applyTheme(p);
}

function render() {
  spinnerEl.hidden = true;
  qrCode.update(getOptions());
  saveToStorage();
}

const debouncedRender = debounce(render, DEBOUNCE_MS);

function setActivePresetButton() {
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.preset === presetEl.value);
  });
}

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    presetEl.value = btn.dataset.preset;
    setActivePresetButton();
    applyPreset();
  });
});

function onDataInput() {
  spinnerEl.hidden = false;
  debouncedRender();
}
dataInput.addEventListener("input", onDataInput);
dataInput.addEventListener("paste", onDataInput);

[dotColor, bgColor, dotType, cornerType, sizeInput, marginInput].forEach(
  (el) => {
    el.addEventListener("change", render);
    el.addEventListener("input", render);
  },
);

downloadBtn.addEventListener("click", () => {
  qrCode.download({ name: "qrcode", extension: "png" });
});

loadFromStorage();
qrCode.append(canvasEl);
render();
