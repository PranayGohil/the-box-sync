export const formatTimeTo12Hour = (timeStr) => {
  if (!timeStr) return "";
  // Check if it's already in 12-hour format (contains AM/PM)
  if (/\b(am|pm)\b/i.test(timeStr)) {
    return timeStr;
  }
  // Try to match "HH:MM" or "HH:MM:SS"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
};
