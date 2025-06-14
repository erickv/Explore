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

document.getElementById("toggleVisualizer").addEventListener("click", () => {
  const container = document.getElementById("visualizerContainer");
  if (container.classList.contains("visualizer-collapsed")) {
    container.classList.remove("visualizer-collapsed");
  } else {
    container.classList.add("visualizer-collapsed");
  }
});

// Simple wireframe pulse simulation
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let t = 0;

function drawVisualizer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "red";
  ctx.beginPath();
  for (let i = 0; i < 360; i += 10) {
    const x = 300 + Math.cos((i + t) * 0.02) * 100;
    const y = 150 + Math.sin((i + t) * 0.02) * 100;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  t += 1;
  requestAnimationFrame(drawVisualizer);
}
drawVisualizer();
