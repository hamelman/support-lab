document.addEventListener("DOMContentLoaded", function () {
  const headerPlaceholder = document.getElementById("header-placeholder");
  if (headerPlaceholder) {
    fetch("/partials/header.html")
      .then(response => response.text())
      .then(data => {
        headerPlaceholder.innerHTML = data;
      })
      .catch(err => console.error("Failed to load header:", err));
  }
});
