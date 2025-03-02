import { toast } from 'sonner';

/**
 * Utility functions for displaying toast notifications
 * 
 * These functions provide a standardized way to display toast notifications
 * across the application with consistent styling and behavior.
 */

/**
 * Display an error toast notification
 * @param {string} message - The error message to display
 */
export const showErrorToast = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
  });
};

/**
 * Display a success toast notification
 * @param {string} message - The success message to display
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-center',
  });
};

/**
 * Display an info toast notification
 * @param {string} message - The info message to display
 */
export const showInfoToast = (message) => {
  toast.info(message, {
    duration: 4000,
    position: 'top-center',
  });
};

/**
 * Display a loading toast notification that can be updated
 * @param {string} message - The loading message to display
 * @returns {function} - A function to update or dismiss the toast
 */
export const showLoadingToast = (message) => {
  return toast.loading(message, {
    duration: 10000, // Longer duration for loading toasts
    position: 'top-center',
  });
};

/**
 * Update a loading toast to a success toast
 * @param {string|number} toastId - The ID of the toast to update
 * @param {string} message - The success message to display
 */
export const updateToastToSuccess = (toastId, message) => {
  toast.success(message, {
    id: toastId,
    duration: 4000,
  });
};

/**
 * Update a loading toast to an error toast
 * @param {string|number} toastId - The ID of the toast to update
 * @param {string} message - The error message to display
 */
export const updateToastToError = (toastId, message) => {
  toast.error(message, {
    id: toastId,
    duration: 4000,
  });
};

/**
 * Dismiss a toast notification
 * @param {string|number} toastId - The ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};