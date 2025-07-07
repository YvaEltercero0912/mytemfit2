document.getElementById('btn-create-user').addEventListener('click', async () => {
    const nombre = prompt("Nombre del alumno:");
    if (!nombre) return;
  
    const email = prompt("Email del alumno (opcional):");
  
    const password = prompt("Contraseña del alumno:");
    if (!password) return;
  
    const profesor = JSON.parse(sessionStorage.getItem('profesor'));
  
    if (!profesor || !profesor.id) {
      alert("No se detectó sesión de profesor. Por favor, vuelva a iniciar sesión.");
      window.location.href = "/index.html";
      return;
    }
  
    const alumno = {
      nombre,
      email,
      password,
      id_profesor: profesor.id
    };
  
    try {
      const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alumno)
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data.error || "Error al crear el alumno");
        return;
      }
  
      alert("✅ Alumno creado con éxito");
      location.reload(); // recargar para ver el nuevo alumno
    } catch (error) {
      console.error("❌ Error al crear alumno:", error);
      alert("Error del servidor");
    }
  });
  