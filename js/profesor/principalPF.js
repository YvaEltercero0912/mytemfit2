document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("btn-search");
  const searchInput = document.getElementById("search-user");
  const userResults = document.getElementById("user-results");
  const createUserBtn = document.getElementById("btn-create-user");

  const profesor = JSON.parse(sessionStorage.getItem("profesor"));
  if (!profesor || !profesor.id) {
    alert("No se detectó sesión. Redirigiendo al login...");
    window.location.href = "/index.html";
    return;
  }

  // Mostrar nombre del profesor
  const nombreSpan = document.getElementById("profesor-nombre");
  if (nombreSpan) {
    nombreSpan.textContent = `Profesor: ${profesor.nombre}`;
  }

  // Botón cerrar sesión (imagen)
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("profesor");
      window.location.href = "/index.html";
    });
  }


  // Buscar usuarios
  searchBtn.addEventListener("click", async () => {
    const nombre = searchInput.value.trim();
    if (!nombre) return;

    try {
      const res = await fetch(`http://localhost:3000/buscar-usuario?nombre=${encodeURIComponent(nombre)}&id_profesor=${profesor.id}`);
      const usuarios = await res.json();

      userResults.innerHTML = "";

      if (!usuarios.length) {
        userResults.innerHTML = "<p>No se encontraron usuarios</p>";
        return;
      }

      usuarios.forEach(usuario => {
        const card = document.createElement("div");
        card.className = "user-card";
        card.dataset.nombre = usuario.nombre;
        card.dataset.foto = usuario.foto || "/img/avatar (1).png";

        const fotoUrl = usuario.foto
          ? `http://localhost:3000${usuario.foto}`
          : "img/avatar (1).png";

        card.innerHTML = `
          <img src="${fotoUrl}" class="avatar" alt="Avatar de ${usuario.nombre}">
          <h3>${usuario.nombre}</h3>
          <div class="user-actions">
            <i class="fas fa-pen edit-icon" title="Editar" data-id="${usuario.id}" data-nombre="${usuario.nombre}"></i>
            <i class="fas fa-eraser delete-icon" title="Eliminar" data-id="${usuario.id}"></i>
          </div>
        `;

        userResults.appendChild(card);
      });
    } catch (error) {
      console.error("❌ Error al buscar usuarios:", error);
      userResults.innerHTML = "<p>Error al buscar usuario</p>";
    }
  });

  // Delegar clics para editar, eliminar y ver detalle
  userResults.addEventListener("click", async (e) => {
    const target = e.target;
    const card = target.closest(".user-card");
    if (!card) return;

    const id = target.dataset.id;
    const nombre = card.dataset.nombre;
    const foto = card.dataset.foto;

    if (target.classList.contains("edit-icon")) {
      const nuevoNombre = prompt("Nuevo nombre de usuario:", nombre);
      if (!nuevoNombre || nuevoNombre === nombre) return;

      try {
        const res = await fetch(`http://localhost:3000/editar-usuario/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nuevoNombre })
        });
        const data = await res.json();
        alert(data.message);
        searchBtn.click();
      } catch (err) {
        console.error("Error al editar:", err);
      }

    } else if (target.classList.contains("delete-icon")) {
      if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
      try {
        const res = await fetch(`http://localhost:3000/eliminar-usuario/${id}`, {
          method: "DELETE"
        });
        const data = await res.json();
        alert(data.message);
        searchBtn.click();
      } catch (err) {
        console.error("Error al eliminar:", err);
      }

    } else {
      // Redirigir al detalle del usuario
      window.location.href = `usuario.html?nombre=${encodeURIComponent(nombre)}&foto=${encodeURIComponent(foto)}`;
    }
  });
});
