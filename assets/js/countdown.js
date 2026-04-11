export function calculateCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      finished: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    finished: false,
    days,
    hours,
    minutes,
    seconds
  };
}

export function formatCountdownParts(countdown) {
  if (countdown.finished) {
    return ["0d", "0h", "0m", "0s"];
  }

  return [
    `${countdown.days}d`,
    `${countdown.hours}h`,
    `${countdown.minutes}m`,
    `${countdown.seconds}s`
  ];
}
