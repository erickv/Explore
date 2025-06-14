document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePricing");
  if (toggle) {
    toggle.addEventListener("change", () => {
      const plans = document.querySelectorAll(".pricing-cards .card");
      plans.forEach((plan) => {
        toggle.checked
          ? plan.classList.add("yearly")
          : plan.classList.remove("yearly");
      });
    });
  }
});