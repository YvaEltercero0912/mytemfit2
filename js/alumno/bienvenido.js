document.addEventListener("DOMContentLoaded", () => {
        const username = document.getElementById("username");
        const avatar = document.getElementById("avatar-img");
        const logout = document.getElementById("logout");

        const userData = JSON.parse(localStorage.getItem("userData"));

        if (!userData || !userData.id || !userData.nombre) {
          window.location.href = "login.html";
          return;
        }

        // Mostrar nombre y foto del usuario logueado
        username.textContent = userData.nombre;
        if (userData.foto) {
          avatar.src = "http://localhost:3000" + userData.foto;
        }

        // Cerrar sesión
        logout.addEventListener("click", () => {
          localStorage.removeItem("userData");
          window.location.href = "/index.html";
        });

        // Enviar datos del formulario
        const form = document.getElementById("form-datos");
        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          const body = {
            id_alumno: userData.id,
            coach: document.getElementById("coach").value,
            objetivo: document.getElementById("objetivo").value,
            sexo: document.getElementById("sexo").value,
            rms: document.getElementById("rms").value,
            modalidad: document.getElementById("modalidad").value,
            profesion: document.getElementById("profesion").value,
            lesiones: document.getElementById("lesiones").value,
          };

          try {
            const res = await fetch(
              "http://localhost:3000/guardar-datos-alumno",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
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
          } catch (error) {
            console.error("Error al enviar datos:", error);
            alert("Error inesperado");
          }
        });
      });