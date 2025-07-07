let profesoresOriginal = [];

    document.addEventListener("DOMContentLoaded", async () => {
      try {
        const res = await fetch("http://localhost:3000/profesores");
        profesoresOriginal = await res.json();
        mostrarProfesores(profesoresOriginal);
      } catch (err) {
        console.error("Error al cargar profesores:", err);
      }

      document.getElementById("buscador").addEventListener("input", (e) => {
        const texto = e.target.value.toLowerCase();
        const filtrados = profesoresOriginal.filter(p =>
          p.nombre.toLowerCase().includes(texto)
        );
        mostrarProfesores(filtrados);
      });
    });

    async function mostrarProfesores(profesores) {
  console.log(profesores);  // Agregar esta línea para inspeccionar la respuesta
  const cuerpo = document.getElementById("lista-profesores");
  cuerpo.innerHTML = "";

  // Verificar si profesores es un array
  if (!Array.isArray(profesores)) {
    console.error("La respuesta no es un array");
    return;
  }

  profesores.forEach(prof => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${prof.nombre}</td>
      <td>${prof.dni}</td>
      <td>
        <input type="number" id="cupo-${prof.id}" value="${prof.cupo_maximo}" min="0" style="width: 60px;">
        <button onclick="actualizarCupo(${prof.id})">Actualizar</button>
      </td>
      <td>${prof.alumnos_actuales}</td>
      <td>
        <button onclick="toggleBloqueo(${prof.id}, ${prof.bloqueado})">
          ${prof.bloqueado ? 'Desbloquear' : 'Bloquear'}
        </button>
      </td>
      <td>
        <button class="eliminar" onclick="eliminarProfesor(${prof.id})">Eliminar</button>
      </td>
    `;
    document.getElementById("lista-profesores").appendChild(tr);
  });
}

    async function actualizarCupo(id_profesor) {
      const nuevoCupo = document.getElementById(`cupo-${id_profesor}`).value;

      try {
        const res = await fetch("http://localhost:3000/actualizar-cupo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_profesor, cupo: parseInt(nuevoCupo) })
        });

        const data = await res.json();
        if (res.ok) {
          alert("Cupo actualizado correctamente");
        } else {
          alert("Error: " + data.error);
        }
      } catch (err) {
        console.error("Error al actualizar cupo:", err);
      }
    }

    async function toggleBloqueo(id_profesor, bloqueadoActual) {
      try {
        const res = await fetch("http://localhost:3000/bloquear-profesor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_profesor, bloquear: !bloqueadoActual })
        });

        const result = await res.json();
        if (res.ok) {
          alert(result.message);
          location.reload();
        } else {
          alert("Error: " + result.error);
        }
      } catch (err) {
        console.error("❌ Error al bloquear/desbloquear profesor:", err);
      }
    }

    // Esta es la función corregida para eliminar el profesor
    async function eliminarProfesor(id_profesor) {
      if (!confirm("¿Seguro que deseas eliminar este profesor?")) return;

      try {
        const res = await fetch(`http://localhost:3000/eliminar-profesor/${id_profesor}`, {
          method: "DELETE"
        });

        const result = await res.json();
        if (res.ok) {
          alert(result.message);
          location.reload();
        } else {
          alert("Error: " + result.error);
        }
      } catch (err) {
        console.error("❌ Error al eliminar profesor:", err);
      }
    }
  

  
    // Abrir modal
    document.getElementById("btn-crear-profesor").addEventListener("click", () => {
      document.getElementById("modal-profesor").classList.remove("hidden");
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener("click", function (e) {
      const modal = document.getElementById("modal-profesor");
      const content = modal.querySelector(".modal-content");
      if (e.target === modal && !content.contains(e.target)) {
        modal.classList.add("hidden");
        document.getElementById("mensaje-profesor").textContent = "";
        document.getElementById("form-crear-profesor").reset();
      }
    });

    // Enviar formulario
    document.getElementById("form-crear-profesor").addEventListener("submit", async e => {
      e.preventDefault();
      const nombre = document.getElementById("nombre").value;
      const password = document.getElementById("password").value;
      const dni = document.getElementById("dni").value;

      try {
        const res = await fetch("http://localhost:3000/crear-profesor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, password, dni })
        });

        const data = await res.json();
        const mensaje = document.getElementById("mensaje-profesor");

        if (res.ok) {
          mensaje.textContent = "✅ Profesor creado con éxito.";
          mensaje.style.color = "#4caf50";
          document.getElementById("form-crear-profesor").reset();
        } else {
          mensaje.textContent = data.error || "❌ Error al crear el profesor";
          mensaje.style.color = "#f44336";
        }
      } catch (err) {
        console.error("Error al crear profesor:", err);
        document.getElementById("mensaje-profesor").textContent = "❌ Error del servidor.";
      }
    });