// Toggle pricing mode (monthly/yearly)
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePricing");

  if (toggle) {
    toggle.addEventListener("change", () => {
      const plans = document.querySelectorAll(".pricing-cards .card");
      plans.forEach((plan) => {
        if (toggle.checked) {
          plan.classList.add("yearly");
          // Optionally update pricing content:
          // plan.querySelector('.price').textContent = "$199/year";
        } else {
          plan.classList.remove("yearly");
          // plan.querySelector('.price').textContent = "$19/month";
        }
      });
    });
  }
});
