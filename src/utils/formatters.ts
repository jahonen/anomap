export const formatMessageAge = (timestamp: Date): string => {
  const now = new Date();
  const age = now.getTime() - timestamp.getTime();
  const hoursOld = age / (1000 * 60 * 60);
  const daysOld = hoursOld / 24;
  
  if (daysOld > 1) {
    return `${Math.floor(daysOld)}d`;
  } else if (hoursOld > 1) {
    return `${Math.floor(hoursOld)}h`;
  } else {
    const minutesOld = age / (1000 * 60);
    return `${Math.max(0, Math.floor(minutesOld))}m`; // Ensure non-negative
  }
};
