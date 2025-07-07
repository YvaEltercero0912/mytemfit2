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
        alert(data.message || data.error);
        if (res.ok) {
          document.getElementById("form-crear-profesor").reset();
        }
      } catch (err) {
        console.error("Error al crear profesor:", err);
      }
    });