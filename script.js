const products = [
  { name: "Coming Soon", price: "", category: "audio" },
  { name: "Coming Soon", price: "", category: "computing" },
  { name: "Coming Soon", price: "", category: "wearables" },
  { name: "Coming Soon", price: "", category: "audio" },
  { name: "Coming Soon", price: "", category: "computing" },
  { name: "Coming Soon", price: "", category: "wearables" }
];

const grid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("category");
const sortFilter = document.getElementById("sort");

function renderProducts() {
  const category = categoryFilter.value;

  let filtered = [...products];
  if (category !== "all") {
    filtered = filtered.filter(p => p.category === category);
  }

  grid.innerHTML = "";
  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="placeholder">🛠️</div>
      <h2>\${product.name}</h2>
      <p style="color:gray">In Progress</p>
    `;
    grid.appendChild(card);
  });

  document.getElementById("itemCount").textContent = `\${filtered.length} items`;
}

categoryFilter.addEventListener("change", renderProducts);
sortFilter.addEventListener("change", renderProducts);
window.onload = renderProducts;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let t = 0;
let bgColor = "#000000";
let lineColor = "#ff0000";

function drawVisualizer() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = lineColor;
  ctx.beginPath();
  for (let i = 0; i < 360; i += 10) {
    const x = w / 2 + Math.cos((i + t) * 0.02) * 100;
    const y = h / 2 + Math.sin((i + t) * 0.02) * 100;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  t += 1;
  requestAnimationFrame(drawVisualizer);
}
drawVisualizer();

document.getElementById("bgColor").addEventListener("input", e => {
  bgColor = e.target.value;
});
document.getElementById("lineColor").addEventListener("input", e => {
  lineColor = e.target.value;
});

document.getElementById("savePreset").addEventListener("click", () => {
  const preset = {
    cc35: document.getElementById("cc35").value,
    cc36: document.getElementById("cc36").value,
    cc37: document.getElementById("cc37").value,
    cc38: document.getElementById("cc38").value,
    cc39: document.getElementById("cc39").value,
    cc40: document.getElementById("cc40").value,
    cc41: document.getElementById("cc41").value,
    bgColor: bgColor,
    lineColor: lineColor,
    shape: document.getElementById("shapeSelect").value
  };
  localStorage.setItem("visualizerPreset", JSON.stringify(preset));
  alert("Preset saved!");
});

document.getElementById("loadPreset").addEventListener("click", () => {
  const preset = JSON.parse(localStorage.getItem("visualizerPreset"));
  if (!preset) return alert("No preset found.");
  Object.keys(preset).forEach(key => {
    const el = document.getElementById(key);
    if (el) el.value = preset[key];
  });
  bgColor = preset.bgColor;
  lineColor = preset.lineColor;
});
