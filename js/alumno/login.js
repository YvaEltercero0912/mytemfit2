document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLogin'); 
    const mensaje = document.getElementById('mensaje'); 

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!nombre || !password) {
            mensaje.textContent = 'Por favor ingresa tu usuario y contraseña';
            mensaje.style.color = 'red';
            return;
        }

        const data = { nombre, password };

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                mensaje.textContent = responseData.message;
                mensaje.style.color = 'green';

                // Guardar datos completos del usuario (con id y foto)
                localStorage.setItem("user", nombre);
                localStorage.setItem("userData", JSON.stringify(responseData.user));

                // Redirigir
                setTimeout(() => window.location.href = 'alumno/index.html', 1000);
            } else {
                mensaje.textContent = responseData.error || 'Error en el inicio de sesión';
                mensaje.style.color = 'red';
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            mensaje.textContent = 'Error al intentar iniciar sesión';
            mensaje.style.color = 'red';
        }
    });
});
