function calcularMetabolismo() {
        const peso = parseFloat(document.getElementById("peso").value);
        const altura = parseFloat(document.getElementById("altura").value);
        const edad = parseInt(document.getElementById("edad").value);
        const actividad = parseFloat(
          document.getElementById("actividad").value
        );
        const sexo = document.querySelector('input[name="sexo"]:checked').value;

        if (isNaN(peso) || isNaN(altura) || isNaN(edad)) {
          alert("Por favor, completa todos los campos correctamente.");
          return;
        }

        let bmr;
        if (sexo === "hombre") {
          bmr = 88.36 + 13.4 * peso + 4.8 * altura - 5.7 * edad;
        } else {
          bmr = 447.6 + 9.2 * peso + 3.1 * altura - 4.3 * edad;
        }

        const mantenimiento = bmr * actividad;
        const adelgazar = mantenimiento - 500;
        const subir = mantenimiento + 500;

        document.getElementById("resultado").innerHTML = `
        <p><strong>Metabolismo basal:</strong> ${Math.round(bmr)} kcal</p>
        <p><strong>Calorías para mantener el peso:</strong> ${Math.round(
          mantenimiento
        )} kcal</p>
        <p><strong>Para adelgazar:</strong> ${Math.round(adelgazar)} kcal</p>
        <p><strong>Para subir de peso:</strong> ${Math.round(subir)} kcal</p>
      `;
      }

      document.addEventListener("DOMContentLoaded", () => {
        const userData = JSON.parse(localStorage.getItem("userData"));
        if (userData && userData.nombre) {
          document.getElementById("username").textContent = userData.nombre;
        }
        if (userData && userData.foto) {
          document.getElementById(
            "avatar-img"
          ).src = `http://localhost:3000${userData.foto}`;
        }
        const username = localStorage.getItem("user") || "Usuario";
        document.getElementById("username").textContent = username;

        const logoutBtn = document.getElementById("logout");
        logoutBtn.addEventListener("click", () => {
          localStorage.removeItem("user");
          localStorage.removeItem("userData");
          window.location.href = "/index.html";
        });

        const avatarInput = document.createElement("input");
        avatarInput.type = "file";
        avatarInput.accept = "image/*";
        avatarInput.style.display = "none";
        document.body.appendChild(avatarInput);

        document.getElementById("avatar-img").addEventListener("click", () => {
          avatarInput.click();
        });

        avatarInput.addEventListener("change", async () => {
          const file = avatarInput.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append("foto", file);

          try {
            const userData = JSON.parse(localStorage.getItem("userData"));
            if (!userData || !userData.id)
              throw new Error("ID de usuario no encontrado");

            const response = await fetch(
              `http://localhost:3000/subir-foto/${userData.id}`,
              {
                method: "POST",
                body: formData,
              }
            );

            const result = await response.json();
            if (response.ok) {
              document.getElementById(
                "avatar-img"
              ).src = `http://localhost:3000${result.ruta}`;
              userData.foto = result.ruta;
              localStorage.setItem("userData", JSON.stringify(userData));
            } else {
              alert("Error al subir la imagen: " + result.error);
            }
          } catch (error) {
            console.error("Error al subir imagen:", error);
          }
        });

        const selectMonth = document.getElementById("select-month");
        const selectWeek = document.getElementById("select-week");
        const selectYear = document.getElementById("select-year");
        const searchButton = document.getElementById("btn-search");
        const routineBox = document.querySelector(".routine-box");

        const currentYear = new Date().getFullYear();
        for (let y = 2025; y <= currentYear + 10; y++) {
          const opt = document.createElement("option");
          opt.value = y;
          opt.textContent = y;
          selectYear.appendChild(opt);
        }
        selectYear.value = currentYear;

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
        meses.forEach((mes, i) => {
          const opt = document.createElement("option");
          opt.value = i + 1;
          opt.textContent = mes;
          selectMonth.appendChild(opt);
        });
        selectMonth.value = new Date().getMonth() + 1;

        for (let i = 1; i <= 4; i++) {
          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = "Semana " + i;
          selectWeek.appendChild(opt);
        }

        async function getRutina() {
          const user = JSON.parse(localStorage.getItem("userData"));
          const mes = selectMonth.value;
          const semana = selectWeek.value;
          const anio = selectYear.value;

          if (!user || !user.id) return;

          try {
            const res = await fetch(
              `http://localhost:3000/planificacion?id_alumno=${user.id}&mes=${mes}&semana=${semana}`
            );
            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
              routineBox.innerHTML = `<p>No hay planificación para ${
                meses[mes - 1]
              } ${anio}, semana ${semana}.</p>`;
            } else {
              let html = `<h3>Planificación: ${
                meses[mes - 1]
              } ${anio}, Semana ${semana}</h3>`;
              data.forEach((ej) => {
                html += `<div class="ejercicio-item">
                                <p><strong>${ej.ejercicio}</strong></p>
                                <p>Series: ${ej.series}, Reps: ${ej.repes}, Kg: ${ej.kg}</p>
                                <p><a href="${ej.video}" target="_blank">Video explicativo</a></p>
                            </div>`;
              });
              routineBox.innerHTML = html;
            }
          } catch (err) {
            console.error("Error al obtener rutina:", err);
            routineBox.innerHTML = `<p>Error al cargar la rutina.</p>`;
          }
        }

        searchButton.addEventListener("click", getRutina);
        getRutina();
      });