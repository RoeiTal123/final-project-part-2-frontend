let toastEl = null;
let hideTimeout = null;
let pinned = false;

export function showToast(message, pageName = "main", type = 'warning', duration = 1500) {
  const containerId = `modal-${pageName}`;
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Toast container not found: #${containerId}`);
    return;
  }

  // create toast element each time (safe + simple)
  const toast = document.createElement("div");
  // Dynamically inject the notification type class alongside the base 'toast' class
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon"></span>
      <span class="toast-text"></span>
    </div>
    <button class="toast-close">✕</button>
  `;

  // Safely target the specific inner text span element
  toast.querySelector(".toast-text").textContent = message;

  // close button
  toast.querySelector(".toast-close").onclick = () => {
    hideToast(toast);
  };

  // click anywhere = pin (stop auto-remove)
  let pinned = false;

  toast.addEventListener("click", () => {
    pinned = true;
  });

  container.appendChild(toast);

  // animate in
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // auto remove if not pinned
  setTimeout(() => {
    if (!pinned) {
      hideToast(toast);
    }
  }, duration);
}

export function hideToast(toast) {
  toast.classList.remove("show");
  toast.classList.add("hide");

  setTimeout(() => {
    toast.remove();
  }, 300);
}
