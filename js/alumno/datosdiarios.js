document.addEventListener("DOMContentLoaded", () => {
        const username = document.getElementById("username");
        const avatar = document.getElementById("avatar-img");
        const logout = document.getElementById("logout");
        const form = document.getElementById("form-datos-diarios");

        const userData = JSON.parse(localStorage.getItem("userData"));

        if (!userData || !userData.id || !userData.nombre) {
          window.location.href = "login.html";
          return;
        }

        // Mostrar nombre y foto del usuario logueado
        username.textContent = userData.nombre;
        if (userData.foto) {
          avatar.src = `http://localhost:3000${userData.foto}`;
        }

        // Cerrar sesión
        logout.addEventListener("click", () => {
          localStorage.removeItem("userData");
          window.location.href = "/index.html";
        });

        // 🔁 Cargar años
        const anioSelect = document.getElementById("anio");
        const currentYear = new Date().getFullYear();
        for (let y = currentYear; y <= currentYear + 5; y++) {
          const opt = document.createElement("option");
          opt.value = y;
          opt.textContent = y;
          anioSelect.appendChild(opt);
        }
        anioSelect.value = currentYear;

        // 🔁 Cargar meses
        const meses = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];
        const mesSelect = document.getElementById("mes");
        meses.forEach((mes, i) => {
          const opt = document.createElement("option");
          opt.value = i + 1;
          opt.textContent = mes;
          mesSelect.appendChild(opt);
        });
        mesSelect.value = new Date().getMonth() + 1;

        // 🔁 Cargar semanas
        const semanaSelect = document.getElementById("semana");
        for (let i = 1; i <= 4; i++) {
          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = `Semana ${i}`;
          semanaSelect.appendChild(opt);
        }

        // 🔁 Cargar días
        const dias = [
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
          "Domingo",
        ];
        const diaSelect = document.getElementById("dia");
        dias.forEach((d, i) => {
          const opt = document.createElement("option");
          opt.value = i + 1;
          opt.textContent = d;
          diaSelect.appendChild(opt);
        });

        // 📌 Guardar datos al enviar formulario
        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          const body = {
            id_alumno: userData.id,
            anio: parseInt(anioSelect.value),
            mes: parseInt(mesSelect.value),
            semana: parseInt(semanaSelect.value),
            dia: parseInt(diaSelect.value),
            fatiga: document.getElementById("fatiga").value,
            alimentacion: document.getElementById("alimentacion").value,
            estres: document.getElementById("estres").value,
            sensacion: document.getElementById("sensacion").value,
            descanso: document.getElementById("descanso").value,
            hidratacion: document.getElementById("hidratacion").value,
            hipe: document.getElementById("hipe").value,
          };

          try {
            const res = await fetch(
              "http://localhost:3000/guardar-datos-diarios",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }
            );

            const result = await res.json();

            if (res.ok) {
              alert("Datos guardados correctamente");
              form.reset();
            } else {
              alert("Error: " + result.error);
            }
          } catch (err) {
            console.error("❌ Error al guardar datos diarios:", err);
            alert("Error inesperado");
          }
        });
      });