let usuarioSeleccionado = null;

  // Cargar años automáticamente
  const selectAnio = document.getElementById("filtro-anio");
  const currentYear = new Date().getFullYear();
  for (let i = 2025; i <= currentYear + 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    if (i === currentYear) option.selected = true;
    selectAnio.appendChild(option);
  }

  // Cargar mes actual automáticamente
  document.getElementById("filtro-mes").value = new Date().getMonth() + 1;

  // Mostrar nombre del profesor en la parte superior
  document.addEventListener("DOMContentLoaded", async () => {
    const profesor = JSON.parse(sessionStorage.getItem("profesor"));
    if (!profesor || !profesor.id) {
      alert("Sesión de profesor no encontrada");
      window.location.href = "/index.html";  // Redirige al login si no se encuentra sesión
      return;
    }

    // Mostrar el nombre del profesor en el encabezado
    document.getElementById("profesor-nombre").textContent = `Profesor: ${profesor.nombre}`;

    // Configurar el botón de logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem('profesor');  // Elimina la sesión del profesor
        window.location.href = "/index.html";  // Redirige al login
      });
    }
  });

  async function buscarUsuario() {
    const nombre = document.getElementById("buscar-nombre").value.trim();
    const profesor = JSON.parse(sessionStorage.getItem("profesor"));

    if (!nombre || !profesor || !profesor.id) {
      alert("Faltan datos para buscar");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/buscar-usuario?nombre=${encodeURIComponent(nombre)}&id_profesor=${profesor.id}`);
      const usuarios = await res.json();

      if (!Array.isArray(usuarios) || usuarios.length === 0) {
        alert("Usuario no encontrado");
        return;
      }

      usuarioSeleccionado = usuarios[0];
      document.getElementById("usuario-header").style.display = "flex";
      document.getElementById("nombre-usuario").textContent = usuarioSeleccionado.nombre;
      document.getElementById("foto-usuario").src = usuarioSeleccionado.foto
        ? `http://localhost:3000${usuarioSeleccionado.foto}`
        : "img/avatar (1).png";

    } catch (err) {
      console.error("Error al buscar usuario:", err);
    }
  }

  async function buscarPlanificacion() {
    const mes = document.getElementById("filtro-mes").value;
    const semana = document.getElementById("filtro-semana").value;
    const anio = document.getElementById("filtro-anio").value;
    const dia = document.getElementById("filtro-dia").value;

    const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    if (!usuarioSeleccionado) {
      alert("Seleccioná un usuario primero");
      return;
    }

    try {
      const url = `http://localhost:3000/planificacion?id_alumno=${usuarioSeleccionado.id}&anio=${anio}&mes=${mes}&semana=${semana}&dia=${dia}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        document.getElementById("resultado-planificacion").innerHTML =
          `<p>No hay planificación para ${diasSemana[dia]}, semana ${semana}, ${getMesTexto(mes)} ${anio}.</p>`;
        return;
      }

      let html = `

        <div class="titulo-tabla-principal"> 
      <div class="planif-header">
          <h2>Planificación de ${usuarioSeleccionado.nombre} - ${diasSemana[dia]} / Semana ${semana} - ${getMesTexto(mes)} ${anio}</h2>
     </div>
    </div>

    <div class="tabla-contenedor">

    <table class="tabla-rutina">
          <thead class="titulo-tabla">
            <tr>
              <th>Ejercicio</th>
              <th>Series</th>
              <th>Reps</th>
              <th>Kg</th>
              <th>Nota</th>
              <th>Video</th>
            </tr>
          </thead>
          <tbody>
    </div>


          <button class="btn-eliminar-planif" onclick="eliminarTodaPlanificacion(${usuarioSeleccionado.id}, ${anio}, ${mes}, ${semana}, ${dia})">
            <img style="width: 20px" src="/img/delete_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.png" alt="Eliminar">
          </button>
      `;

      const ordenados = [
        ...data.filter(e => e.tipo === "basico"),
        ...data.filter(e => e.tipo !== "basico"),
      ];

      ordenados.forEach(ej => {
        const color = ej.tipo === "basico" ? 'style="color: red;"' : '';
        html += `
          <tr>
            <td ${color}><strong>${ej.ejercicio}</strong></td>
            <td>${ej.series}</td>
            <td>${ej.repes}</td>
            <td>${ej.kg}</td>
            <td>${ej.nota || "—"}</td>
            <td>${ej.video ? `<a href="${ej.video}" target="_blank"><img src="/img/play.png" style="width: 20px;"></a>` : "—"}</td>
          </tr>
        `;
      });

      html += "</tbody></table>";
      document.getElementById("resultado-planificacion").innerHTML = html;

    } catch (err) {
      console.error("Error al buscar planificación:", err);
      document.getElementById("resultado-planificacion").innerHTML = `<p>Error al cargar planificación</p>`;
    }
  }

  function getMesTexto(index) {
    const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses[index] || "";
  }

  async function eliminarTodaPlanificacion(id_alumno, anio, mes, semana, dia) {
    if (!confirm("¿Seguro que querés eliminar TODA la planificación de este usuario para ese día?")) return;

    try {
      const url = `http://localhost:3000/eliminar-planificacion?id_alumno=${id_alumno}&anio=${anio}&mes=${mes}&semana=${semana}&dia=${dia}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      alert(data.message);
      buscarPlanificacion();
    } catch (err) {
      console.error("Error al eliminar planificación:", err);
    }
  }

  document.getElementById("buscar-nombre").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      buscarUsuario();
    }
  });