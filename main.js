(function () {
  const sportsDataEl = document.getElementById("sports-data");
  const sports = sportsDataEl ? JSON.parse(sportsDataEl.textContent) : [];
  const sportsById = Object.fromEntries(sports.map((s) => [s.id, s]));

  const form = document.getElementById("registration-form");
  const sportSelect = document.getElementById("sport_id");
  const timingSelect = document.getElementById("timing_slot");
  const feeSelect = document.getElementById("fee_plan");
  const summaryEl = document.getElementById("selected-summary");
  const toastEl = document.getElementById("toast");

  function showToast(message, isError) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.toggle("error", !!isError);
    toastEl.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toastEl.hidden = true;
    }, 5000);
  }

  function fillSportOptions(sportId) {
    const sport = sportsById[sportId];
    if (!sport) {
      timingSelect.innerHTML = '<option value="">Select sport first</option>';
      feeSelect.innerHTML = '<option value="">Select sport first</option>';
      timingSelect.disabled = true;
      feeSelect.disabled = true;
      summaryEl.hidden = true;
      return;
    }

    timingSelect.innerHTML =
      '<option value="">Choose batch / timing</option>' +
      sport.timings
        .map((t) => {
          const val = `${t.slot} — ${t.time}`;
          return `<option value="${escapeAttr(val)}">${escapeHtml(t.slot)} (${escapeHtml(t.time)})</option>`;
        })
        .join("");

    feeSelect.innerHTML =
      '<option value="">Choose fee plan</option>' +
      sport.fees
        .map((f) => {
          const val = `${f.plan} — ₹${f.amount.toLocaleString("en-IN")}`;
          return `<option value="${escapeAttr(val)}">${escapeHtml(f.plan)} — ₹${f.amount.toLocaleString("en-IN")}</option>`;
        })
        .join("");

    timingSelect.disabled = false;
    feeSelect.disabled = false;
    updateSummary();
  }

  function updateSummary() {
    const sport = sportsById[sportSelect.value];
    const timing = timingSelect.value;
    const fee = feeSelect.value;
    if (!sport || !timing || !fee) {
      summaryEl.hidden = true;
      return;
    }
    summaryEl.hidden = false;
    summaryEl.innerHTML = `
      <strong>Your selection</strong><br>
      ${escapeHtml(sport.icon)} ${escapeHtml(sport.name)}<br>
      Days: ${sport.days.map(escapeHtml).join(", ")}<br>
      Timing: ${escapeHtml(timing)}<br>
      Plan: ${escapeHtml(fee)}
    `;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/"/g, "&quot;");
  }

  function scrollToRegister(sportId) {
    const registerSection = document.getElementById("register");
    if (registerSection) registerSection.scrollIntoView({ behavior: "smooth" });
    if (sportId && sportSelect) {
      sportSelect.value = sportId;
      fillSportOptions(sportId);
      document.querySelectorAll(".sport-card").forEach((card) => {
        card.classList.toggle("highlight", card.dataset.sportId === sportId);
      });
    }
  }

  if (sportSelect) {
    sportSelect.addEventListener("change", () => {
      fillSportOptions(sportSelect.value);
      document.querySelectorAll(".sport-card").forEach((card) => {
        card.classList.toggle("highlight", card.dataset.sportId === sportSelect.value);
      });
    });
    timingSelect.addEventListener("change", updateSummary);
    feeSelect.addEventListener("change", updateSummary);
  }

  document.querySelectorAll(".btn-register-sport").forEach((btn) => {
    btn.addEventListener("click", () => scrollToRegister(btn.dataset.sportId));
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        full_name: form.full_name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        age: form.age.value.trim(),
        sport_id: form.sport_id.value,
        timing_slot: form.timing_slot.value,
        fee_plan: form.fee_plan.value,
        notes: form.notes.value.trim(),
      };

      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showToast(data.error || "Registration failed. Please try again.", true);
          return;
        }
        showToast(data.message, false);
        form.reset();
        fillSportOptions("");
        document.querySelectorAll(".sport-card").forEach((c) => c.classList.remove("highlight"));
      } catch {
        showToast("Network error. Check your connection and try again.", true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit registration";
      }
    });
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open);
    });
  }
})();
