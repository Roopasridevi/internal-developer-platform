import { format, formatDistance } from 'date-fns';

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export const formatShortDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};
