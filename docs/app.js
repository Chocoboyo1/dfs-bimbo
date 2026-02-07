
// clase para representar una tarea :)
class Tarea {
    constructor(nombre, completada = false) {
        this.nombre = nombre;
        this.completada = completada;
    }

    editar(nuevoNombre) {
        this.nombre = nuevoNombre;
    }

    toggleEstado() {
        this.completada = !this.completada;
    }
}

// clase encargada de gestionar las tareas :)
class GestorDeTareas {
    constructor() {
        this.tareas = JSON.parse(localStorage.getItem("tareas")) || [];
    }

    agregarTarea(nombre) {
        const tarea = new Tarea(nombre);
        this.tareas.push(tarea);
        this.guardar();
    }

    eliminarTarea(index) {
        this.tareas.splice(index, 1);
        this.guardar();
    }

    editarTarea(index, nuevoNombre) {
        this.tareas[index].editar(nuevoNombre);
        this.guardar();
    }

    guardar() {
        localStorage.setItem("tareas", JSON.stringify(this.tareas));
    }
}

const gestor = new GestorDeTareas();

const input = document.getElementById("nuevaTarea");
const btnAgregar = document.getElementById("btnAgregar");
const lista = document.getElementById("listaTareas");

//funcion para mostrar las tareas en la lista :)
const mostrarTareas = () => {
    lista.innerHTML = "";

    gestor.tareas.forEach((tarea, index) => {
        lista.innerHTML += `
            <li>
                <span>${tarea.nombre}</span>
                <button onclick="editarTarea(${index})">Editar</button>
                <button onclick="eliminarTarea(${index})">Eliminar</button>
            </li>
        `;
    });
};

// evento para agregar una nueva tarea :) 

btnAgregar.addEventListener("click", () => {
    if (input.value.trim() === "") {
        alert("No puedes agregar una tarea vacia");
        return;
    }

    gestor.agregarTarea(input.value);
    input.value = "";
    mostrarTareas();
});

//funcion para eliminar una tarea :)
const eliminarTarea = (index) => {
    gestor.eliminarTarea(index);
    mostrarTareas();
};

//funcion para editar una tarea :)
const editarTarea = (index) => {
    const nuevoNombre = prompt("Editar tarea:", gestor.tareas[index].nombre);

    if (nuevoNombre !== null && nuevoNombre.trim() !== "") {
        gestor.editarTarea(index, nuevoNombre);
        mostrarTareas();
    }
};

mostrarTareas();
