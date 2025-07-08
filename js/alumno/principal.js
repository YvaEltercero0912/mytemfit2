document.addEventListener("DOMContentLoaded", () => {
  const selectYear = document.getElementById("select-year");
  const selectMonth = document.getElementById("select-month");
  const selectWeek = document.getElementById("select-week");
  const selectDia = document.getElementById("select-dia");
  const currentYear = new Date().getFullYear();

  let storedYears = JSON.parse(localStorage.getItem("addedYears")) || [];

  if (!storedYears.includes(currentYear)) {
    storedYears.push(currentYear);
    localStorage.setItem("addedYears", JSON.stringify(storedYears));
  }

  storedYears = storedYears.filter(y => y >= currentYear).sort((a, b) => a - b);
  selectYear.innerHTML = "";
  storedYears.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    selectYear.appendChild(option);
  });
  selectYear.value = currentYear;

  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
    "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  months.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index + 1;
    option.textContent = month;
    selectMonth.appendChild(option);
  });
  selectMonth.value = new Date().getMonth() + 1;

  for (let i = 1; i <= 4; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Semana ${i}`;
    selectWeek.appendChild(option);
  }

  const days = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  for (let i = 1; i <= 7; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = days[i];
    selectDia.appendChild(option);
  }

  const currentDay = new Date().getDay();
  const dayToSelect = currentDay === 0 ? 7 : currentDay;
  selectDia.value = dayToSelect;

  const usernameDisplay = document.getElementById("username");
  const avatarImg = document.getElementById("avatar-img");
  const logoutButton = document.getElementById("logout");
  const userData = JSON.parse(localStorage.getItem("userData"));

  if (!userData || !userData.nombre || !userData.id) {
    window.location.href = "/index.html";
    return;
  }

  usernameDisplay.textContent = userData.nombre;
  if (userData.foto) {
    avatarImg.src = `http://localhost:3000${userData.foto}`;
  }

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  });

  const listaEjercicios = document.getElementById("lista-ejercicios");
const detalleEjercicio = document.getElementById("detalle-ejercicio");
const user = JSON.parse(localStorage.getItem("userData"));

async function getRutina() {
  const anio = selectYear.value;
  const mes = selectMonth.value;
  const semana = selectWeek.value;
  const dia = selectDia.value;

  if (!user || !user.id) return;

  try {
    const res = await fetch(`http://localhost:3000/planificacion?id_alumno=${user.id}&anio=${anio}&mes=${mes}&semana=${semana}&dia=${dia}`);
    const data = await res.json();

    listaEjercicios.innerHTML = "";

    const ordenados = [
      ...data.filter(e => e.tipo === "basico"),
      ...data.filter(e => e.tipo !== "basico")
    ];

    ordenados.forEach((ej, index) => {
      const div = document.createElement("div");
      div.className = "ejercicios";
      div.innerHTML = `
        <div class="ejercicios_nombre">
          <button
            class="btn btn-warning"
            data-bs-toggle="modal"
            data-bs-target="#exampleModal"
            data-index="${index}"
          >
            ${ej.ejercicio}
          </button>
        </div>
      `;
      listaEjercicios.appendChild(div);
    });

    // Almacena datos globalmente para usar al hacer clic
    window.listaDeEjercicios = ordenados;
  } catch (err) {
    console.error("Error al obtener rutina:", err);
    listaEjercicios.innerHTML = `<p>Error al cargar ejercicios.</p>`;
  }
}

// Evento al abrir el modal
document.getElementById("exampleModal").addEventListener("show.bs.modal", (e) => {
  const button = e.relatedTarget;
  const index = button.getAttribute("data-index");
  const ej = window.listaDeEjercicios[index];

  const videoHTML = ej.video
    ? `<a href="${ej.video}" target="_blank"><img src="/img/play.png" alt="Video" class="icono-play" style="width: 20px;"></a>`
    : "—";

  detalleEjercicio.innerHTML = `
    <p><strong>Ejercicio:</strong> ${ej.ejercicio}</p>
    <p><strong>Series:</strong> ${ej.series}</p>
    <p><strong>Repeticiones:</strong> ${ej.repes}</p>
    <p><strong>Kg:</strong> ${ej.kg}</p>
    <p><strong>Nota:</strong> ${ej.nota || "—"}</p>
    <p><strong>Video:</strong> ${videoHTML}</p>
  `;
});

searchButton.addEventListener("click", getRutina);
getRutina();


  // ============================
  // ESTADO DE PAGO SEGÚN FECHA
  // ============================

  const estadoPagoTexto = document.getElementById("estado-pago-texto");

  async function cargarEstadoPago() {
    try {
      const res = await fetch(`http://localhost:3000/obtener-estado-pago?id_alumno=${userData.id}`);
      const data = await res.json();

      if (data && data.fecha_vencimiento) {
        const fechaVencimiento = new Date(data.fecha_vencimiento);
        const hoy = new Date();

        fechaVencimiento.setHours(0, 0, 0, 0);
        hoy.setHours(0, 0, 0, 0);

        const diff = Math.floor((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
        let estado = "verde";
        let mensaje = "Estás al día";

        if (diff >= 0 && diff <= 3) {
          estado = "naranja";
          mensaje = "Faltan 2 días para vencer";
        }
        if (diff < 0) {
          estado = "rojo";
          mensaje = "Vencido";
        }

        estadoPagoTexto.innerHTML = `<span class="pelotita ${estado}" title="${mensaje}"></span>`;
        estadoPagoTexto.classList.remove("estado-verde", "estado-naranja", "estado-rojo");
      } else {
        estadoPagoTexto.textContent = "No disponible";
        estadoPagoTexto.classList.remove("estado-verde", "estado-naranja", "estado-rojo");
      }
    } catch (err) {
      console.error("Error al cargar el estado de pago:", err);
      estadoPagoTexto.textContent = "Error al verificar";
      estadoPagoTexto.classList.remove("estado-verde", "estado-naranja", "estado-rojo");
    }
  }

  cargarEstadoPago();
});



const avatarInput = document.getElementById("avatar-input");
const avatarImg = document.getElementById("avatar-img");

avatarImg.addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("foto", file);

  try {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const response = await fetch(`http://localhost:3000/subir-foto/${userData.id}`, {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    if (response.ok) {
      avatarImg.src = `http://localhost:3000${result.ruta}`;
      userData.foto = result.ruta;
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      alert("Error al subir la imagen: " + result.error);
    }
  } catch (error) {
    console.error("Error al subir imagen:", error);
  }
});


//noti

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));

  if (!userData || !userData.id) {
    console.warn("No se encontró userData.id en localStorage");
    return;
  }

  fetch(`http://localhost:3000/estado-vencimiento/${userData.id}`)
    .then(res => res.json())
    .then(data => {
      console.log("➡ Datos recibidos:", data); // 👈 MUY IMPORTANTE

      const notificacion = document.getElementById("notificacion-vencido");
      if (!notificacion || !data.fecha_vencimiento) return;

      const fechaVenc = new Date(data.fecha_vencimiento);
      const hoy = new Date();
      fechaVenc.setHours(0, 0, 0, 0);
      hoy.setHours(0, 0, 0, 0);

      const diferenciaDias = Math.floor((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

      if (diferenciaDias < 0) {
        notificacion.textContent = "❌ Tu mensualidad está vencida. Por favor, contacta a tu profesor.";
        notificacion.style.display = "block";
        notificacion.style.backgroundColor = "red";
      } else if (diferenciaDias <= 3) {
        notificacion.textContent = `⚠ Tu mensualidad vence en ${diferenciaDias} día${diferenciaDias !== 1 ? 's' : ''}.`;
        notificacion.style.display = "block";
        notificacion.style.backgroundColor = "orange";
      } else {
        notificacion.style.display = "none";
      }
    })
    .catch(err => {
      console.error("Error al verificar vencimiento:", err);
    });
});










