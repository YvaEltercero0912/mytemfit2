document.getElementById('form-login-profesor').addEventListener('submit', async (e) => {
    e.preventDefault();

    const dni = document.getElementById('dni').value.trim();
    const password = document.getElementById('password-2').value.trim();

    if (!dni || !password) {
      document.getElementById('error-msg').textContent = "Todos los campos son obligatorios";
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/login-profesor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password })
      });

      const data = await res.json();

      if (!res.ok) {
        document.getElementById('error-msg').textContent = data.error || 'Error al iniciar sesión';
        return;
      }

      // ✅ Guardar los datos del profesor en sessionStorage
      sessionStorage.setItem('profesor', JSON.stringify(data.profesor));

      // ✅ Redirigir al panel de admin
      window.location.href = "profesor/admin.html";

    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      document.getElementById('error-msg').textContent = "Error del servidor";
    }
  });