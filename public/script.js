let prevOccupied = 0;
const valueRollAnimations = new Map();

initValueRollers();
initParallax();

async function fetchData() {
  try {
    const res = await fetch("/data");
    const data = await res.json();

    rollValue("total", data.total);
    rollValue("occupied", data.occupied);
    rollValue("vacant", data.vacant);

    animateCar(data.occupied);
    glowEffect(data.occupied);

    prevOccupied = data.occupied;
  } catch (error) {
    console.error("Failed to fetch parking data:", error);
  }
}

fetchData();
setInterval(fetchData, 2000);

function initValueRollers() {
  ["total", "occupied", "vacant"].forEach((id) => {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    const initialValue = normalizeNumericText(element.textContent);
    element.textContent = initialValue;
    element.dataset.value = initialValue;
  });
}

function rollValue(id, nextRawValue) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  const nextValue = normalizeNumericText(nextRawValue);
  const previousValue = element.dataset.value ?? normalizeNumericText(element.textContent);

  if (nextValue === previousValue) {
    element.textContent = nextValue;
    element.dataset.value = nextValue;
    return;
  }

  const activeTimeline = valueRollAnimations.get(element);
  if (activeTimeline) {
    activeTimeline.kill();
    valueRollAnimations.delete(element);
  }

  const direction = Number(nextValue) >= Number(previousValue) ? 1 : -1;

  const currentLayer = document.createElement("span");
  currentLayer.className = "value-roll-layer";
  currentLayer.textContent = previousValue;

  const nextLayer = document.createElement("span");
  nextLayer.className = "value-roll-layer";
  nextLayer.textContent = nextValue;

  element.textContent = "";
  element.append(currentLayer, nextLayer);

  gsap.set(currentLayer, { yPercent: 0 });
  gsap.set(nextLayer, { yPercent: direction > 0 ? 110 : -110 });

  const timeline = gsap.timeline({
    defaults: { duration: 0.5, ease: "power3.out" },
    onStart: () => element.classList.add("is-rolling"),
    onComplete: () => {
      element.classList.remove("is-rolling");
      element.textContent = nextValue;
      element.dataset.value = nextValue;
      valueRollAnimations.delete(element);
    }
  });

  timeline
    .to(currentLayer, { yPercent: direction > 0 ? -115 : 115 }, 0)
    .to(nextLayer, { yPercent: 0 }, 0);

  valueRollAnimations.set(element, timeline);
}

function normalizeNumericText(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return String(Math.round(numeric));
  }
  return "0";
}

function initParallax() {
  const root = document.documentElement;

  let targetX = 0;
  let targetY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;

  let scrollOffsetY = 0;

  let pointerX = 0;
  let pointerY = 0;
  let pointerTiltX = 0;
  let pointerTiltY = 0;

  let gyroX = 0;
  let gyroY = 0;
  let gyroTiltX = 0;
  let gyroTiltY = 0;

  let currentX = 0;
  let currentY = 16;
  let currentTiltX = 0;
  let currentTiltY = 0;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobileLike = window.matchMedia("(pointer: coarse)").matches;

  function composeTargets() {
    targetX = pointerX + gyroX;
    targetY = scrollOffsetY + pointerY + gyroY;
    targetTiltX = pointerTiltX + gyroTiltX;
    targetTiltY = pointerTiltY + gyroTiltY;
  }

  function updateScrollTargets() {
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const scrollProgress = Math.min(window.scrollY / maxScroll, 1);

    scrollOffsetY = -10 * scrollProgress;
    composeTargets();
  }

  function updatePointer(event) {
    if (isMobileLike) {
      return;
    }

    const nx = event.clientX / window.innerWidth - 0.5;
    const ny = event.clientY / window.innerHeight - 0.5;

    pointerX = nx * 24;
    pointerY = ny * 8;
    pointerTiltY = nx * 8;
    pointerTiltX = -ny * 6.5;
    composeTargets();
  }

  function resetPointerTargets() {
    pointerX = 0;
    pointerY = 0;
    pointerTiltX = 0;
    pointerTiltY = 0;
    composeTargets();
  }

  function updateGyro(event) {
    if (!isMobileLike) {
      return;
    }

    const gamma = clamp(event.gamma ?? 0, -28, 28);
    const beta = clamp(event.beta ?? 0, -28, 28);

    const nx = gamma / 28;
    const ny = beta / 28;

    gyroX = nx * 22;
    gyroY = ny * 7;
    gyroTiltY = nx * 9;
    gyroTiltX = -ny * 7;
    composeTargets();
  }

  function enableGyroIfAvailable() {
    if (!isMobileLike || !("DeviceOrientationEvent" in window)) {
      return;
    }

    const attachGyro = () => {
      window.addEventListener("deviceorientation", updateGyro, { passive: true });
    };

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      let attemptedPermission = false;

      const requestPermission = async () => {
        if (attemptedPermission) {
          return;
        }
        attemptedPermission = true;

        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === "granted") {
            attachGyro();
          }
        } catch (error) {
          console.warn("Gyroscope permission unavailable:", error);
        }
      };

      window.addEventListener("touchstart", requestPermission, { once: true, passive: true });
      window.addEventListener("click", requestPermission, { once: true, passive: true });
      return;
    }

    attachGyro();
  }

  function animateParallax(timestamp) {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;

    const flowY = reducedMotion ? 0 : Math.sin(timestamp * 0.003) * 4.6;

    root.style.setProperty("--parallax-x", `${currentX.toFixed(2)}px`);
    root.style.setProperty("--parallax-y", `${currentY.toFixed(2)}px`);
    root.style.setProperty("--tilt-x", `${currentTiltX.toFixed(2)}deg`);
    root.style.setProperty("--tilt-y", `${currentTiltY.toFixed(2)}deg`);
    root.style.setProperty("--flow-y", `${flowY.toFixed(2)}px`);

    requestAnimationFrame(animateParallax);
  }

  updateScrollTargets();
  enableGyroIfAvailable();

  window.addEventListener("mousemove", updatePointer, { passive: true });
  window.addEventListener("mouseleave", resetPointerTargets, { passive: true });
  window.addEventListener("scroll", updateScrollTargets, { passive: true });
  window.addEventListener("resize", updateScrollTargets);
  window.addEventListener("blur", resetPointerTargets);

  requestAnimationFrame(animateParallax);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* 🚗 CAR LOGIC */
function animateCar(current) {
  const car = document.getElementById("car");

  // ENTRY (car goes forward)
  if (current > prevOccupied) {
    gsap.to(car, {
      y: -250,
      scale: 0.8,
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to(car, {
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power2.out"
        });
      }
    });
  }

  // EXIT (car comes back)
  if (current < prevOccupied) {
    gsap.fromTo(car,
      { y: -250, scale: 0.8 },
      {
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power2.inOut"
      }
    );
  }
}

/* ✨ GLOW */
function glowEffect(current) {
  const occ = document.getElementById("occupiedCard");
  const vac = document.getElementById("vacantCard");

  if (current > prevOccupied) {
    occ.classList.add("active");
    setTimeout(() => occ.classList.remove("active"), 500);
  }

  if (current < prevOccupied) {
    vac.classList.add("active");
    setTimeout(() => vac.classList.remove("active"), 500);
  }
}