"use strict";
/* ---- Bemor monitori: ECG animatsiyasi ---- */
class Monitor {
  constructor(canvas, { hr, sp, co }) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.el = { hr, sp, co };
    this.state = { hr: 72, sp: 99, co: 36, amp: 1 };
    this.t = 0;
    this.last = 0;
    this.head = 0;
    this.visible = true;
    this.resize();
    addEventListener("resize", () => this.resize());
    new IntersectionObserver(
      (e) => (this.visible = e[0].isIntersecting),
    ).observe(canvas);
    setInterval(() => this.jitter(), 1000);
    requestAnimationFrame((t) => this.frame(t));
  }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    this.w = this.c.width = this.c.clientWidth * d;
    this.h = this.c.height = this.c.clientHeight * d;
    this.d = d;
    this.buf = new Float32Array(this.w).fill(this.h / 2);
    this.head = 0;
  }
  wave(p) {
    const g = (m, s) => Math.exp(-(((p - m) / s) ** 2));
    return (
      0.1 * g(0.18, 0.03) -
      0.12 * g(0.36, 0.012) +
      g(0.4, 0.012) -
      0.22 * g(0.44, 0.014) +
      0.24 * g(0.68, 0.05)
    );
  }
  jitter() {
    const s = this.state,
      r = (n) => Math.round(Math.random() * n - n / 2);
    this.el.hr.textContent = Math.max(30, s.hr + r(2));
    this.el.sp.textContent = Math.min(
      100,
      s.sp + (Math.random() < 0.3 ? r(1) : 0),
    );
    this.el.co.textContent = s.co + r(2);
  }
  set(v) {
    Object.assign(this.state, v);
    this.jitter();
  }
  frame(now) {
    const dt = Math.min((now - this.last) / 1000 || 0, 0.05);
    this.last = now;
    if (this.visible) {
      const px = 170 * this.d * dt,
        hz = this.state.hr / 60,
        speed = 170 * this.d;
      const steps = Math.max(1, Math.round(px));
      for (let i = 0; i < steps; i++) {
        this.t += 1 / speed;
        const p = (this.t * hz) % 1;
        this.buf[this.head] =
          this.h * 0.62 -
          this.wave(p) * this.h * 0.42 * this.state.amp +
          (Math.random() - 0.5) * 1.2;
        this.head = (this.head + 1) % this.w;
      }
      this.draw();
    }
    requestAnimationFrame((t) => this.frame(t));
  }
  draw() {
    const x = this.ctx,
      { w, h, buf, head } = this;
    x.clearRect(0, 0, w, h);
    x.strokeStyle = "rgba(55,229,165,.07)";
    x.lineWidth = 1;
    for (let i = 0; i < w; i += 40 * this.d) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i, h);
      x.stroke();
    }
    for (let j = 0; j < h; j += 40 * this.d) {
      x.beginPath();
      x.moveTo(0, j);
      x.lineTo(w, j);
      x.stroke();
    }
    x.strokeStyle = "#37E5A5";
    x.lineWidth = 2.4 * this.d;
    x.lineJoin = "round";
    x.shadowColor = "#37E5A5";
    x.shadowBlur = 10 * this.d;
    x.beginPath();
    let pen = false;
    const gap = 24 * this.d;
    for (let i = 0; i < w; i++) {
      const dist = (i - head + w) % w;
      if (dist < gap) {
        pen = false;
        continue;
      }
      pen ? x.lineTo(i, buf[i]) : x.moveTo(i, buf[i]);
      pen = true;
    }
    x.stroke();
    x.shadowBlur = 0;
  }
}

const m1 = new Monitor(document.getElementById("ecg1"), {
  hr: hr1,
  sp: sp1,
  co: co1,
});
const m2 = new Monitor(document.getElementById("ecg2"), {
  hr: hr2,
  sp: sp2,
  co: co2,
});

/* ---- Turlari (tablar) ---- */
const types = [
  {
    t: "Umumiy narkoz",
    pro: "Bemor hech narsani sezmaydi, uzoq va katta operatsiyalarga mos, jarrohga qulay.",
    con: "Nafas yo‘lini ta’minlash kerak, ko‘ngil aynishi ko‘proq, uyg‘onish uzoqroq.",
    d: "Bemor ongi to‘liq o‘chadi. Katta va uzoq operatsiyalarda (qorin bo‘shlig‘i, ko‘krak qafasi, bosh miya) qo‘llanadi.",
    list: [
      "<b>Ingalyatsion:</b> dori nafas yo‘li orqali beriladi",
      "<b>Noingalyatsion:</b> dori vena ichiga yuboriladi",
      "<b>Kombinatsiyalangan (balansli):</b> bir necha dori birga, dozalar kam",
      "<b>Maskali yoki intubatsion:</b> nafas yo‘lini ta’minlash usuli bo‘yicha",
    ],
    drugs: [
      "Sevofluran",
      "Izofluran",
      "Azot oksidi",
      "Propofol",
      "Ketamin",
      "Fentanil",
      "Rokuronium",
    ],
  },
  {
    t: "Mintaqaviy",
    pro: "Bemor tez tiklanadi, operatsiyadan keyin ham og‘riqsizlik qoladi, nafas yo‘liga aralashuv kerak emas.",
    con: "Hamma bemorga mos kelmaydi (qon ivish buzilishi, in’ektsiya joyida infeksiya), bosim tushishi mumkin.",
    d: "Tananing ma’lum qismi og‘riqsizlanadi, bemor ongi saqlanadi yoki yengil sedatsiya beriladi. Oyoq, kesarcha kesish, kichik chanoq operatsiyalarida qulay.",
    list: [
      "<b>Spinal:</b> igna orqa miya suyuqligigacha kiritiladi, ta’sir tez",
      "<b>Epidural:</b> kateter orqali, uzoq ta’sir va og‘riqsizlantirishni uzaytirish mumkin",
      "<b>Periferik nerv blokadasi:</b> qo‘l yoki oyoq nervi atrofiga yuboriladi",
    ],
    drugs: ["Bupivakain", "Ropivakain", "Lidokain"],
  },
  {
    t: "Mahalliy",
    pro: "Eng oddiy va xavfsiz, bemor ongli, tez uyga ketadi.",
    con: "Faqat kichik sohada ishlaydi, bemor qo‘rquvi saqlanishi mumkin, dozasi cheklangan.",
    d: "Faqat operatsiya joyi og‘riqsizlanadi. Kichik muolajalar: jarohatni tikish, o‘smani olib tashlash, tish davolash.",
    list: [
      "<b>Infiltratsion:</b> to‘qima ichiga eritma yuboriladi",
      "<b>Applikatsion:</b> shilliq qavat yoki teriga surtiladi yoki purkaladi",
    ],
    drugs: ["Lidokain", "Novokain", "Artikain"],
  },
  {
    t: "Sedatsiya",
    pro: "Qo‘rquvni kamaytiradi, tezda tiklanadi, narkozdan yengilroq.",
    con: "Nafas susayishi mumkin, chuqurlik oshib ketsa narkozga o‘tadi, monitoring shart.",
    d: "Bemor tinch, uyqusirash holatida, ammo o‘zi nafas oladi. Endoskopiya, MRT va kichik muolajalar paytida mahalliy yoki mintaqaviy usul bilan birga beriladi.",
    list: [
      "<b>Yengil:</b> bemor savolga javob beradi",
      "<b>O‘rta:</b> uyqusirab, ovozga reaksiya qiladi",
      "<b>Chuqur:</b> narkozga yaqin, doimiy nazorat talab qilinadi",
    ],
    drugs: ["Midazolam", "Propofol", "Deksmedetomidin"],
  },
];
const panel = document.getElementById("panel"),
  tabs = document.querySelectorAll("#tabs button");
function showType(i) {
  const o = types[i];
  panel.style.animation = "none";
  panel.offsetHeight;
  panel.style.animation = "";
  panel.innerHTML = `<div><h3>${o.t}</h3><p>${o.d}</p></div><div><h4>Turlari</h4><ul>${o.list.map((l) => `<li>${l}</li>`).join("")}</ul><h4>Afzalliklari</h4><p class="pc">${o.pro}</p><h4>Cheklovlari</h4><p class="pc">${o.con}</p><h4>Ko‘p ishlatiladigan dorilar</h4><div class="chips">${o.drugs.map((d) => `<span>${d}</span>`).join("")}</div></div>`;
  tabs.forEach((b, k) => b.setAttribute("aria-selected", k == i));
}
tabs.forEach((b) => b.addEventListener("click", () => showType(+b.dataset.i)));
showType(0);

/* ---- Guedel bosqichlari ---- */
const stages = [
  {
    n: "I bosqich — analgeziya",
    x: "Bemor ongi saqlanadi, lekin og‘riq sezgisi kamayadi. Nafas va yurak urishi deyarli o‘zgarmaydi.",
    w: 25,
    hr: 76,
    sp: 99,
    co: 36,
    amp: 1,
  },
  {
    n: "II bosqich — qo‘zg‘alish",
    x: "Ong o‘chadi, lekin markaziy asab tizimi qo‘zg‘aladi: harakat, nafas notekisligi, yurak urishi tezlashadi. Zamonaviy induksiyada bu bosqich tez o‘tkaziladi.",
    w: 50,
    hr: 118,
    sp: 97,
    co: 41,
    amp: 1.25,
  },
  {
    n: "III bosqich — jarrohlik narkozi",
    x: "Operatsiya o‘tkaziladigan chuqurlik: bemor uxlaydi, og‘riq sezmaydi, mushaklar bo‘shashgan. Nafas va qon aylanishi anesteziolog nazoratida.",
    w: 78,
    hr: 62,
    sp: 99,
    co: 35,
    amp: 0.9,
  },
  {
    n: "IV bosqich — haddan tashqari chuqurlik",
    x: "Dori ortiqcha: nafas va yurak faoliyati susayadi. Xavfli holat, dozani darhol kamaytirish va qo‘llab-quvvatlash kerak.",
    w: 100,
    hr: 38,
    sp: 84,
    co: 24,
    amp: 0.55,
  },
];
const rng = document.getElementById("stage"),
  meter = document.getElementById("meter");
function setStage(i) {
  const s = stages[i];
  document.getElementById("st-title").textContent = s.n;
  document.getElementById("st-text").textContent = s.x;
  meter.style.width = s.w + "%";
  meter.style.background =
    i == 3 ? "var(--bad)" : i == 1 ? "var(--amber)" : "var(--scrub)";
  m2.c.parentElement.classList.toggle("warn", i == 3);
  m2.set(s);
}
rng.addEventListener("input", () => setStage(+rng.value));
setStage(0);

/* ---- Timeline: ko‘ringanda chiziq chiziladi ---- */
const tl = document.getElementById("timeline");
new IntersectionObserver(
  (e, o) => {
    if (e[0].isIntersecting) {
      tl.classList.add("in");
      o.disconnect();
    }
  },
  { threshold: 0.35 },
).observe(tl);
