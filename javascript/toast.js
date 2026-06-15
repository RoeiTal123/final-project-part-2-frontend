let toastEl = null;
let hideTimeout = null;
let pinned = false;

export function showToast(message, pageName = "main", duration = 10000) {
  const containerId = `modal-${pageName}`;
  const container = document.getElementById(containerId);
  console.log("container:", document.getElementById(`modal-${pageName}`));
  if (!container) {
    console.warn(`Toast container not found: #${containerId}`);
    return;
  }

  // create toast element each time (safe + simple)
  const toast = document.createElement("div");
  toast.className = "toast";

  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-text"></span>
      <button class="toast-close">✕</button>
    </div>
  `;

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