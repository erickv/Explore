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
