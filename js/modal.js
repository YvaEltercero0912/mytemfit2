const modal = document.getElementById("modal");
const modalContenido = modal.querySelector(".modal-contenido");
const cerrar = modal.querySelector(".modal-cerrar");
const seccion2 = document.querySelector(".seccion-2");

document.querySelectorAll(".ejercicios_nombre").forEach((item) => {
  item.addEventListener("click", () => {
    modalContenido.appendChild(seccion2); // Mueve la sección al modal
    modal.style.display = "block";
  });
});

cerrar.onclick = () => {
  modal.style.display = "none";
  document.querySelector("main").appendChild(seccion2); // Devuelve la sección a su lugar original
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.querySelector("main").appendChild(seccion2);
  }
};
