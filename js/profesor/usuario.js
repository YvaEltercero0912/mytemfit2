let ejercicios = [];

const params = new URLSearchParams(window.location.search);
const nombre = params.get("nombre") || "Usuario";
const foto = params.get("foto") || "/img/avatar (1).png";

document.getElementById("nombre-usuario").textContent = nombre;
document.getElementById("foto-usuario").src = `http://localhost:3000${foto}`;

const mesSelect = document.getElementById("mes-select");
const currentMonth = new Date().getMonth() + 1;
for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = new Date(0, i - 1).toLocaleString('es', { month: 'long' });
    if (i === currentMonth) option.selected = true;
    mesSelect.appendChild(option);
}

const diaSelect = document.getElementById("dia-select");
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
for (let i = 1; i <= 7; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} - ${diasSemana[i - 1]}`;
    diaSelect.appendChild(option);
}

// Año
const anioSelect = document.getElementById("anio-select");
const currentYear = new Date().getFullYear();
for (let i = 2025; i <= currentYear + 10; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    if (i === currentYear) option.selected = true;
    anioSelect.appendChild(option);
}

let idAlumno = null;
const profesor = JSON.parse(sessionStorage.getItem("profesor"));

if (!profesor || !profesor.id) {
    alert("No se detectó sesión de profesor.");
    window.location.href = "/index.html";
} else {
    fetch(`http://localhost:3000/buscar-usuario?nombre=${encodeURIComponent(nombre)}&id_profesor=${profesor.id}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0 && data[0].id) {
                idAlumno = data[0].id;
            } else {
                console.error("Usuario no encontrado o respuesta inválida:", data);
            }
        })
        .catch(err => {
            console.error("Error al obtener el usuario:", err);
        });
}

document.getElementById("form-planificacion").addEventListener("submit", e => {
    e.preventDefault();
    const ejercicio = document.getElementById("ejercicio").value.trim();
    const series = document.getElementById("series").value.trim();
    const repes = document.getElementById("repes").value.trim();
    const kg = document.getElementById("kg").value.trim();
    const video = document.getElementById("video").value.trim();
    const nota = document.getElementById("nota").value.trim();
    const tipoInput = document.querySelector('input[name="tipo"]:checked');
    const tipo = tipoInput ? tipoInput.value : "accesorio";

    ejercicios.push({ ejercicio, series, repes, kg, video, tipo, nota });
    actualizarLista();
    e.target.reset();
});

document.getElementById("btn-guardar").addEventListener("click", async () => {
    const anio = parseInt(document.getElementById("anio-select").value);
    const mes = parseInt(document.getElementById("mes-select").value);
    const semana = parseInt(document.getElementById("semana-select").value);
    const dia = parseInt(document.getElementById("dia-select").value);

    if (!idAlumno) {
        alert("ID del alumno no encontrado.");
        return;
    }

    const ejerciciosConvertidos = ejercicios.map(ej => ({
        ejercicio: ej.ejercicio,
        series: ej.series.trim() === "" ? null : parseInt(ej.series),
        repes: ej.repes.trim() === "" ? null : parseInt(ej.repes),
        kg: ej.kg.trim() === "" ? null : parseInt(ej.kg),
        video: ej.video,
        tipo: ej.tipo,
        nota: ej.nota
    }));

    for (const ej of ejerciciosConvertidos) {
        const res = await fetch("http://localhost:3000/guardar-planificacion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_alumno: idAlumno,
                anio,
                mes,
                semana,
                dia,
                ejercicio: ej.ejercicio,
                series: ej.series,
                repes: ej.repes,
                kg: ej.kg,
                video: ej.video,
                tipo: ej.tipo,
                nota: ej.nota
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            alert("Error al guardar planificación: " + errorData.error);
            return;
        }
    }

    alert("Planificación guardada correctamente");
    ejercicios = [];
    actualizarLista();
});

function actualizarLista() {
    const lista = document.getElementById("lista-ejercicios");
    lista.innerHTML = "";

    const ordenados = [
        ...ejercicios.filter(e => e.tipo === "basico"),
        ...ejercicios.filter(e => e.tipo !== "basico"),
    ];

    ordenados.forEach((ej, index) => {
        const tr = document.createElement("tr");
        if (ej.tipo === "basico") tr.style.color = "red";

        tr.innerHTML = `
            <td><strong>${ej.ejercicio}</strong></td>
            <td>${ej.series}</td>
            <td>${ej.repes}</td>
            <td>${ej.kg}</td>
            <td>${ej.nota || "—"}</td>
            <td>${ej.video ? `<a href="${ej.video}" target="_blank" style="color: #00b8e1;">Ver</a>` : "—"}</td>
            <td>
                <img src="/img/editar.png" title="Editar" onclick="editarEjercicio(${index})" style="width: 20px; cursor: pointer; margin-right: 10px;">
                <img src="/img/eliminar.png" title="Eliminar" onclick="eliminarEjercicio(${index})" style="width: 20px; cursor: pointer;">
            </td>
        `;
        lista.appendChild(tr);
    });
}

function editarEjercicio(index) {
    const ej = ejercicios[index];
    const nuevoEjercicio = prompt("Ejercicio:", ej.ejercicio);
    const nuevasSeries = prompt("Series:", ej.series);
    const nuevasRepes = prompt("Repeticiones:", ej.repes);
    const nuevoKg = prompt("Kg:", ej.kg);
    const nuevoVideo = prompt("Enlace de video:", ej.video);
    const nuevaNota = prompt("Nota:", ej.nota);

    if (nuevoEjercicio) ejercicios[index].ejercicio = nuevoEjercicio;
    if (nuevasSeries) ejercicios[index].series = nuevasSeries;
    if (nuevasRepes) ejercicios[index].repes = nuevasRepes;
    if (nuevoKg) ejercicios[index].kg = nuevoKg;
    if (nuevoVideo) ejercicios[index].video = nuevoVideo;
    if (nuevaNota) ejercicios[index].nota = nuevaNota;

    actualizarLista();
}

function eliminarEjercicio(index) {
    if (confirm("¿Deseas eliminar este ejercicio?")) {
        ejercicios.splice(index, 1);
        actualizarLista();
    }
}


// Mostrar nombre del profesor
const profesorData = JSON.parse(sessionStorage.getItem("profesor"));
if (profesorData && profesorData.nombre) {
  document.getElementById("profesor-nombre").textContent = `Profesor: ${profesorData.nombre}`;
}

// Cerrar sesión
document.getElementById("logout-btn").addEventListener("click", () => {
  fetch("http://localhost:3000/logout", {
    method: "POST",
  })
    .then(() => {
      sessionStorage.removeItem("profesor");
      window.location.href = "/index.html";
    })
    .catch((err) => {
      console.error("Error al cerrar sesión:", err);
    });
});

//notifiacion

document.addEventListener("DOMContentLoaded", () => {
  const idAlumno = sessionStorage.getItem("id_alumno"); // o donde guardes el ID

  if (idAlumno) {
    fetch(`http://localhost:3000/estado-vencimiento/${idAlumno}`)
      .then(res => res.json())
      .then(data => {
        if (data.vencido) {
          document.getElementById("notificacion-vencido").style.display = "block";
        }
      })
      .catch(err => console.error("Error al verificar vencimiento:", err));
  }
});