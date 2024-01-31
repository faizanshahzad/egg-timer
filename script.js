const eggContainer = document.querySelector(".egg-container");
const egg = document.querySelector(".egg");
const eggTop = document.querySelector(".egg-top");
const timeRuler = document.querySelector(".time-ruler-faces-container");
const timeContainer = document.querySelector(".time-container");
const timerButton = document.querySelector(".timer-button");
const minuteDegreeInterval = 6;
const secondDegreeInterval = minuteDegreeInterval / 60;
let timerInterval;

const timerWindingSound = new Howl({
  src: ["https://assets.codepen.io/4175254/timer-winding_1.mp3"]
});

const timerAlarmSound = new Howl({
  src: ["https://assets.codepen.io/4175254/timer-alarm.mp3"]
});

const timerTickingSound = new Howl({
  src: ["https://assets.codepen.io/4175254/timer-ticking.mp3"],
  loop: true
});

const closeTimer = () => {
  eggContainer.classList.remove("active");
  eggContainer.addEventListener("click", openTimer);
  document.removeEventListener("click", closeTimer);
};

const handleClickOutside = (e) => {
  if (!e.target.closest(".egg, .timer-button") && !timerAlarmSound.playing()) {
    document.addEventListener(
      "pointerup",
      (e) => {
        if (!e.target.closest(".egg, .timer-button")) {
          eggContainer.classList.remove("active");
          document.removeEventListener("pointerdown", handleClickOutside);
        }
      },
      { once: true }
    );
  }
};

const isTimerOpen = () => eggContainer.classList.contains("active");

const openTimer = (e) => {
  e.stopPropagation();
  if (isTimerOpen() || timerAlarmSound.playing()) return;
  eggContainer.classList.add("active");
  document.addEventListener("pointerdown", handleClickOutside);
};

egg.addEventListener("click", openTimer);

const isTimerRunning = () => !!timerInterval;

const pauseTimer = () => {
  timerTickingSound.pause();
  clearInterval(timerInterval);
};

const stopTimer = () => {
  pauseTimer();
  timerInterval = null;
  timerButton.textContent = "Start";
  timerButton.classList.remove("stop");
};

const resumeTimer = () => {
  timerTickingSound.play();
  timerInterval = setInterval(() => {
    const currentRotation = getTimeRulerRotation();
    if (currentRotation + secondDegreeInterval >= 0) {
      egg.classList.add("ringing");
      updateTime(0);
      stopTimer();

      timerAlarmSound.once("end", () => {
        egg.classList.remove("ringing");
      });

      timerAlarmSound.play();
      navigator.vibrate?.(timerAlarmSound.duration() * 1000);
      timerButton.disabled = true;

      return;
    }
    const newRotation = currentRotation + secondDegreeInterval;
    timeRuler.style.setProperty("--rotation", `${newRotation}deg`);
    const translation = parseFloat(
      getComputedStyle(eggTop).getPropertyValue("--background-translation")
    );
    const newTranslation = translation + 12 / 10;
    eggTop.style.setProperty("--background-translation", `${newTranslation}px`);
    updateTime(newRotation);
  }, 1000);
};

const startTimer = () => {
  resumeTimer();
  timerButton.textContent = "Stop";
  timerButton.classList.add("stop");
};

const getTimeRulerRotation = () => {
  return parseFloat(getComputedStyle(timeRuler).getPropertyValue("--rotation"));
};

const getAdjustedTimeRulerRotation = (
  timeRulerRotation = getTimeRulerRotation()
) => {
  const minRotation = -360;
  const maxRotation = 0;
  const adjustedRotation = Math.max(
    minRotation,
    Math.min(
      maxRotation,
      Math.round(timeRulerRotation / minuteDegreeInterval) *
        minuteDegreeInterval
    )
  );
  return adjustedRotation;
};

const adjustTimeRulerRotation = () => {
  timeRuler.style.setProperty(
    "--rotation",
    `${getAdjustedTimeRulerRotation()}deg`
  );
};

const updateTime = (rotation) => {
  const totalSeconds = Math.round(Math.abs(rotation / secondDegreeInterval));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  timeContainer.textContent = hours
    ? `${hours}:${formattedMinutes}:${formattedSeconds}`
    : `${minutes}:${formattedSeconds}`;
};

let lastRotation = 0;

eggTop.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!isTimerOpen() || timerAlarmSound.playing()) return;
  const startX = e.clientX;
  const startAngle = getTimeRulerRotation();
  eggTop.classList.add("dragged");
  if (isTimerRunning()) pauseTimer();

  const pointerMoveHandler = (e) => {
    e.preventDefault();
    const deltaX = e.clientX - startX;
    const angle = deltaX / 2;
    const endAngle = startAngle + angle;
    timeRuler.style.setProperty("--rotation", `${endAngle}deg`);
    const adjustedRotation = getAdjustedTimeRulerRotation(endAngle);
    eggTop.style.setProperty("--background-translation", `${deltaX}px`);
    updateTime(adjustedRotation);

    if (!isTimerRunning()) {
      timerButton.disabled = adjustedRotation >= 0;
    }

    if (Math.abs(adjustedRotation - lastRotation) >= 6) {
      timerWindingSound.play();
      navigator.vibrate?.(50);
      lastRotation = adjustedRotation;
    }
  };

  const pointerUpHandler = () => {
    eggTop.classList.remove("dragged");
    if (isTimerRunning()) resumeTimer();
    adjustTimeRulerRotation();
    const translation = parseFloat(
      getComputedStyle(eggTop).getPropertyValue("--background-translation")
    );
    const adjustedTranslation = Math.max(
      0,
      Math.min(-720, Math.round(translation / 12) * 12)
    );
    eggTop.style.setProperty(
      "--background-translation",
      `${adjustedTranslation}px`
    );
    document.removeEventListener("pointermove", pointerMoveHandler);
    document.removeEventListener("pointerup", pointerUpHandler);
  };

  document.addEventListener("pointermove", pointerMoveHandler);
  document.addEventListener("pointerup", pointerUpHandler);
});

timerButton.addEventListener("click", () => {
  isTimerRunning() ? stopTimer() : startTimer();
});
