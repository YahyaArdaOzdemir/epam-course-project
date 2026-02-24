/** Maps backend auth error payload codes/messages to user-safe UI alert text. */
export const mapAuthError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Request failed. Please try again.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('invalid credentials')) {
    return 'Email or password is incorrect.';
  }

  if (message.includes('already exists') || message.includes('conflict')) {
    return 'An account with this email already exists.';
  }

  if (message.includes('password must include')) {
    return 'Password must include uppercase, lowercase, number, and special character.';
  }

  if (message.includes('too many attempts')) {
    return 'Too many attempts. Please wait and try again.';
  }

  if (message.includes('session is invalid') || message.includes('unauthorized')) {
    return 'Your session has expired. Please login again.';
  }

  if (message.includes('reset token is invalid') || message.includes('expired')) {
    return 'Reset link is invalid or expired. Request a new one.';
  }

  return error.message;
};
