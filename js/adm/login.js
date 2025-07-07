document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Credenciales de login
    const correctUsername = "xxx22alex22xxx";
    const correctPassword = "locoxriver22xdxd22";

    const errorMessage = document.getElementById("errorMessage");

    // Verificar si las credenciales son correctas
    if (username === correctUsername && password === correctPassword) {
        // Redirigir a la página de ver profesores
        window.location.href = "ver_profesores.html";
    } else {
        // Mostrar mensaje de error
        errorMessage.textContent = "Usuario o contraseña incorrectos";
    }
});
