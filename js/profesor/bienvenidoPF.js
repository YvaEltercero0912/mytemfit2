document.addEventListener("DOMContentLoaded", async () => {
      const select = document.getElementById("alumno-select");
      const datosDiv = document.getElementById("datos-alumno");
      const selectFecha = document.getElementById("seleccion-fecha");
      const datosDiariosDiv = document.getElementById("datos-diarios");
    
      let idAlumnoSeleccionado = null;
    
      const spans = {
        coach: document.getElementById("coach"),
        objetivo: document.getElementById("objetivo"),
        sexo: document.getElementById("sexo"),
        rms: document.getElementById("rms"),
        modalidad: document.getElementById("modalidad"),
        profesion: document.getElementById("profesion"),
        lesiones: document.getElementById("lesiones")
      };
    
      const spanDatos = {
        fatiga: document.getElementById("fatiga"),
        alimentacion: document.getElementById("alimentacion"),
        estres: document.getElementById("estres"),
        sensacion: document.getElementById("sensacion"),
        descanso: document.getElementById("descanso"),
        hidratacion: document.getElementById("hidratacion"),
        hipe: document.getElementById("hipe"),
      };
    
      // Obtener lista de alumnos
      const profesor = JSON.parse(sessionStorage.getItem("profesor"));
      if (!profesor || !profesor.id) {
        alert("Sesión de profesor no encontrada");
        window.location.href = "/index.html";
        return;
      }
    
      try {
        const res = await fetch(`http://localhost:3000/alumnos-profesor/${profesor.id}`);
        const alumnos = await res.json();
    
        alumnos.forEach(alumno => {
          const option = document.createElement("option");
          option.value = alumno.id;
          option.textContent = alumno.nombre;
          select.appendChild(option);
        });
      } catch (error) {
        console.error("Error al cargar alumnos:", error);
      }
    
      select.addEventListener("change", async () => {
        const id = select.value;
        idAlumnoSeleccionado = id;
    
        if (!id) {
          datosDiv.style.display = "none";
          selectFecha.style.display = "none";
          datosDiariosDiv.style.display = "none";
          return;
        }
    
        // Mostrar selección de fecha
        selectFecha.style.display = "block";
    
        try {
          const res = await fetch(`http://localhost:3000/datos-alumno/${id}`);
          const datos = await res.json();
    
          if (datos && datos.id_alumno) {
            spans.coach.textContent = datos.coach;
            spans.objetivo.textContent = datos.objetivo;
            spans.sexo.textContent = datos.sexo;
            spans.rms.textContent = datos.rms;
            spans.modalidad.textContent = datos.modalidad;
            spans.profesion.textContent = datos.profesion;
            spans.lesiones.textContent = datos.lesiones;
            datosDiv.style.display = "block";
          } else {
            datosDiv.style.display = "none";
            alert("Este alumno no ha cargado sus datos aún.");
          }
        } catch (error) {
          console.error("Error al obtener datos del alumno:", error);
          datosDiv.style.display = "none";
        }
      });
    
      // Cargar selects de año y mes
      const selectAnio = document.getElementById("anio");
      const selectMes = document.getElementById("mes");
      const currentYear = new Date().getFullYear();
      for (let y = currentYear; y <= currentYear + 5; y++) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        selectAnio.appendChild(opt);
      }
      selectAnio.value = currentYear;
    
      const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
        "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      meses.forEach((mes, i) => {
        const opt = document.createElement("option");
        opt.value = i + 1;
        opt.textContent = mes;
        selectMes.appendChild(opt);
      });
      selectMes.value = new Date().getMonth() + 1;
    
      // Botón para buscar datos diarios
      document.getElementById("btn-buscar-datos").addEventListener("click", async () => {
        const anio = selectAnio.value;
        const mes = selectMes.value;
        const semana = document.getElementById("semana").value;
        const dia = document.getElementById("dia").value;
    
        if (!idAlumnoSeleccionado) return;
    
        try {
          const res = await fetch(`http://localhost:3000/datos-diarios/${idAlumnoSeleccionado}?anio=${anio}&mes=${mes}&semana=${semana}&dia=${dia}`);
          const data = await res.json();
    
          if (res.ok && data) {
            spanDatos.fatiga.textContent = data.fatiga || "—";
            spanDatos.alimentacion.textContent = data.alimentacion || "—";
            spanDatos.estres.textContent = data.estres || "—";
            spanDatos.sensacion.textContent = data.sensacion || "—";
            spanDatos.descanso.textContent = data.descanso || "—";
            spanDatos.hidratacion.textContent = data.hidratacion || "—";
            spanDatos.hipe.textContent = data.hipe || "—";
            datosDiariosDiv.style.display = "block";
          } else {
            alert("No se encontraron datos diarios para esa fecha");
            datosDiariosDiv.style.display = "none";
          }
        } catch (err) {
          console.error("❌ Error al obtener datos diarios:", err);
          alert("Error al buscar datos");
        }
      });
    });

    // Mostrar nombre del profesor y manejar cierre de sesión
    document.addEventListener("DOMContentLoaded", () => {
      const logoutBtn = document.getElementById("logout-btn");
      const nombreSpan = document.getElementById("profesor-nombre");
      const profesor = JSON.parse(sessionStorage.getItem("profesor"));

      if (!profesor || !profesor.nombre) {
        alert("Sesión no válida. Redirigiendo al login...");
        window.location.href = "/index.html";
        return;
      }

      // Mostrar el nombre
      nombreSpan.textContent = `Profesor: ${profesor.nombre}`;

      // Cierre de sesión
      logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("profesor");
        window.location.href = "/index.html";
      });
    });
  


  document.getElementById("btn-create-user").addEventListener("click", () => {
    document.getElementById("modal-create-user").classList.remove("hidden");
  });
  
  const form = document.getElementById("crear-alumno-form");
  const mensaje = document.getElementById("mensaje");
  
  const profesor = JSON.parse(sessionStorage.getItem("profesor"));
  if (!profesor) {
    alert("No hay sesión activa de profesor");
    window.location.href = "/index.html";
  }
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
  
    const alumno = {
      nombre,
      email,
      password,
      id_profesor: profesor.id
    };
  
    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumno)
      });
  
      const data = await res.json();
  
      if (res.ok) {
        mensaje.textContent = "✅ Alumno creado con éxito.";
        mensaje.className = "message success";
        form.reset();
      } else {
        mensaje.textContent = data.error || "❌ Error al crear el alumno";
        mensaje.className = "message error";
      }
    } catch (err) {
      console.error("Error:", err);
      mensaje.textContent = "❌ Error del servidor.";
      mensaje.className = "message error";
    }
  });

  // Cerrar el modal al hacer clic fuera del contenido
window.addEventListener("click", function (e) {
const modal = document.getElementById("modal-create-user");
const modalContent = modal.querySelector(".modal-content");

if (e.target === modal && !modalContent.contains(e.target)) {
modal.classList.add("hidden");
// También limpiamos el mensaje y el formulario
document.getElementById("mensaje").textContent = "";
form.reset();
}
});
