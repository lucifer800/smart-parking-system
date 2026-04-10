let prevOccupied = 0;

async function fetchData() {
  const res = await fetch("/data");
  const data = await res.json();

  document.getElementById("total").innerText = data.total;
  document.getElementById("occupied").innerText = data.occupied;
  document.getElementById("vacant").innerText = data.vacant;

  animateCar(data.occupied);
  glowEffect(data.occupied);

  prevOccupied = data.occupied;
}

setInterval(fetchData, 2000);

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