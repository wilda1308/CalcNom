/* HISTORIAL DE NÓMINAS */

//Elementos HTML para insertar filas, buscador de nominas y mensaje vacio
const tablaHistorial = document.getElementById('tabla-historial');
const buscarNominaInput = document.getElementById('buscar-nomina');
const mensajeVacio = document.getElementById('mensaje-vacio');

// FORMATEO DE VALORES MONETARIOS: Formatear valores monetarios a pesos colombianos
function formatoMoneda(valor){
    return '$ ' + Number(valor).toLocaleString('es-CO',{
        maximumFractionDigits: 0
    });
}

//Evitar que los datos de empleados sean tratados como HTML.
function escaparHTML(texto){
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

/* MOSTRAR LAS NÓMINAS REGISTRADAS: Si existen mostrar todos con sus respectivos campos, si no mostrar el mensaje de vacio */

function mostrarHistorial(registros = nominas){
    //Limpiar las filas anteriores
    tablaHistorial.innerHTML = '';

    //Comprobar si existen registros
    if(registros.length === 0){
        mensajeVacio.classList.remove('d-none');

        if(nominas.length === 0){
            mensajeVacio.querySelector('p').textContent = 'No hay registros de nómina disponibles para mostrar.'
        } else {
            //Mensaje para cuando el campo de buscar nomina por documento o nombre no se encuentra.
            mensajeVacio.querySelector('p').textContent = 'No se encontraron nóminas con esos datos.';
        }

        return;
    }

    //Ocultar el mensaje de vacio.
    mensajeVacio.classList.add('d-none');

    //Recorrer los registros y construir de una vez las filas.
    registros.forEach(nomina => {
        const empleado = nomina.empleado;

        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${escaparHTML(empleado.documento)}</td>
            <td>
                ${escaparHTML(empleado.nombre)}
                ${escaparHTML(empleado.apellido)}
            </td>
            <td>${escaparHTML(empleado.area)}</td>
            <td>${escaparHTML(nomina.periodo)}</td>
            <td class="text-end fw-semibold">${formatoMoneda(nomina.nominaAPagar)}</td>
            <td class="text-end">
                <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${nomina.id}" title="Eliminar nómina" aria-label="Eliminar nómina ${nomina.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        tablaHistorial.appendChild(fila);
    });
}

function normalizar(texto){
    return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[\u03000-\u036f]/g, '');
}

//Buscar por documento, nombre o apellido.
function buscarNomina(){
    const busqueda = normalizar(buscarNominaInput.value.trim());

    const resultados = nominas.filter(nomina => {
        const empleado = nomina.empleado;

        return normalizar(`${empleado.documento} ${empleado.nombre} ${empleado.apellido}`).includes(busqueda);
    });

    mostrarHistorial(resultados);
}

/* EVENTOS DEL HISTORIAL */


//Detectar cambios en el campo de buscar con evento input
buscarNominaInput.addEventListener('input', buscarNomina);

//Eliminar una nómina
tablaHistorial.addEventListener('click', (evento) => {
    const botonEliminar = evento.target.closest('.btn-eliminar');

    if(!botonEliminar){
        return;
    }

    const id = Number(botonEliminar.dataset.id);

    const confirmar = confirm(
        '¿Estás seguro de eliminar esta nómina del historial?'
    );

    if(!confirmar){
        return;
    }

    //Eliminar el registro del arreglo filtrandolo por el id
    nominas = nominas.filter(nomina => nomina.id !== id);

    //Actualizar localStorage
    guardarNominas();

    //Volver a mostrar los registros aplicando la busqueda actual.
    buscarNomina();
    window.location.reload();
});

//Mostrar el historial al cargar la página
mostrarHistorial();
