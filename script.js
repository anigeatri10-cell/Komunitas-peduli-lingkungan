document.documentElement.classList.add("js");

// Akad dimulai pukul 08.00 WIB (UTC+7)
const WEDDING_DATE = new Date("2026-12-20T08:00:00+07:00");

document.addEventListener("DOMContentLoaded", () => {
  initCover();
  initCountdown();
  initReveal();
  initCopyButtons();
  initRsvp();
  document.getElementById("tahun").textContent = new Date().getFullYear();
});

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Nama tamu diambil dari tautan, contoh: index.html?to=Gea+%2F+Partner
function getGuestName() {
  const value = new URLSearchParams(window.location.search).get("to");
  return value ? value.trim().slice(0, 80) : "";
}

function initCover() {
  const root = document.documentElement;
  const cover = document.getElementById("sampul");
  const page = document.getElementById("halaman");
  const hero = document.getElementById("beranda");
  const guestName = getGuestName();

  if (guestName) {
    document.getElementById("nama-tamu").textContent = guestName;
    document.getElementById("nama").value = guestName;
  }

  root.classList.add("is-locked");
  page.inert = true;

  document.getElementById("buka-undangan").addEventListener("click", () => {
    page.inert = false;
    root.classList.remove("is-locked");
    cover.classList.add("is-open");
    hero.focus({ preventScroll: true });
    setTimeout(() => (cover.hidden = true), prefersReducedMotion() ? 0 : 1000);
  });
}

function initCountdown() {
  const fields = {
    days: document.getElementById("cd-hari"),
    hours: document.getElementById("cd-jam"),
    minutes: document.getElementById("cd-menit"),
    seconds: document.getElementById("cd-detik"),
  };
  const message = document.getElementById("cd-pesan");
  const pad = (value) => String(value).padStart(2, "0");
  let timer = null;

  function render() {
    const remaining = WEDDING_DATE.getTime() - Date.now();

    if (remaining <= 0) {
      Object.values(fields).forEach((field) => (field.textContent = "00"));
      message.textContent = "Hari bahagia telah tiba. Terima kasih atas doa restunya.";
      if (timer) clearInterval(timer);
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    fields.days.textContent = pad(Math.floor(totalSeconds / 86400));
    fields.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    fields.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    fields.seconds.textContent = pad(totalSeconds % 60);
  }

  render();
  timer = setInterval(render, 1000);
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API bisa diblokir (mis. di dalam iframe), jadi coba cara lama.
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    helper.remove();
    return copied;
  }
}

function initCopyButtons() {
  document.querySelectorAll("[data-salin]").forEach((button) => {
    const defaultLabel = button.textContent;

    button.addEventListener("click", async () => {
      const copied = await copyText(button.dataset.salin);
      button.textContent = copied ? "Tersalin" : "Gagal menyalin";
      setTimeout(() => (button.textContent = defaultLabel), 2000);
    });
  });
}

function initRsvp() {
  const form = document.getElementById("form-rsvp");
  const nameInput = document.getElementById("nama");
  const guestSelect = document.getElementById("jumlah");
  const status = document.getElementById("rsvp-status");
  const wishList = document.getElementById("ucapan-list");
  const wishCount = document.getElementById("ucapan-jumlah");
  const wishEmpty = document.getElementById("ucapan-kosong");

  form.querySelectorAll('input[name="kehadiran"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      guestSelect.disabled = radio.value !== "hadir";
    });
  });

  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("nama") || "").trim();
    const attending = data.get("kehadiran") === "hadir";
    const guests = attending ? Number(guestSelect.value) : 0;
    const wish = String(data.get("ucapan") || "").trim();

    if (!name) {
      nameInput.setCustomValidity("Mohon isi nama Anda.");
      nameInput.reportValidity();
      return;
    }

    status.textContent = attending
      ? `Terima kasih, ${name}. Kami menantikan kehadiran Anda (${guests} orang).`
      : `Terima kasih, ${name}. Doa restu Anda sangat berarti bagi kami.`;

    if (wish) {
      wishList.prepend(createWish(name, attending, wish));
      wishCount.textContent = wishList.children.length;
      wishEmpty.hidden = true;
    }

    form.reset();
    guestSelect.disabled = false;
  });
}

function createWish(name, attending, text) {
  const item = document.createElement("li");
  item.className = "wish";

  const head = document.createElement("div");
  head.className = "wish__head";

  const nameEl = document.createElement("span");
  nameEl.className = "wish__name";
  nameEl.textContent = name;

  const statusEl = document.createElement("span");
  statusEl.className = "wish__status";
  statusEl.textContent = attending ? "Hadir" : "Tidak hadir";

  const textEl = document.createElement("p");
  textEl.className = "wish__text";
  textEl.textContent = text;

  head.append(nameEl, statusEl);
  item.append(head, textEl);
  return item;
}
