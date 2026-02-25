export const focusErrorAlert = (elementId: string): void => {
  const target = document.getElementById(elementId);
  if (!target) {
    return;
  }

  target.setAttribute('tabindex', '-1');
  target.focus();
};
