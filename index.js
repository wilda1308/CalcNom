
/* FUNCIONALIDADES DE PANEL PRINCIPAL, MOSTRAR INFORMACIÓN GENERAL Y CONTENIDO RECIENTE. */

/* Elementos a utilizar del HTML (DOM) */
const fechaActual = document.getElementById('fecha-actual');

const contadorEmpleados = document.querySelector('.count-registros');
const contadorNominas = document.querySelector('.count-n-nominas');
const totalNominas = document.querySelector('.count-total-nominas');
const periodoActual = document.querySelector('.count-mes');

const tablaRecientes = document.querySelector('.tabla-recientes');
const mensajeVacioRecientes = document.querySelector('.empty');

/* FORMATEAR VALORES */
//formatear valores monetarios
function formatearMoneda(valor){
    return '$ ' + Number(valor).toLocaleString('es-CO', {
        maximumFractionDigits: 0
    });
}

//Evitar interpretar datos como código HTML
function escaparHTML(texto){
    const elemento = document.createElement('div');
    elemento.textContent = texto ?? '';

    return elemento.innerHTML;
}

// -------------- Fecha y Periodo -----------------


/*Función para mostrar la fecha actual en el formato deseado de  dia de la 
semana, día, mes y año en el formato español (Colombia).*/
function showDate(){
    const fecha = new Date();

    fechaActual.textContent = fecha.toLocaleDateString('es-CO', { weekday: 'long', day: "numeric", year: 'numeric', month: 'long', day: 'numeric' });

    if(periodoActual){
        periodoActual.textContent = fecha.toLocaleDateString('es-CO', {
            month: 'long',
            year: 'numeric'
        });
    }
}

// ---------------- ESTADÍSTICAS DEL PANEL -------------------

function actualizarIndicadores(){
    //Cantidad total de nóminas
    contadorNominas.textContent = nominas.length;

    //obtener empleados únicos mediante su documento.
    const empleados = new Set(
        nominas.map(nomina => nomina.empleado.documento)
    );

    contadorEmpleados.textContent = empleados.size;

    //Sumar los salarios netos de todas las nóminas.
    const totalPagado = nominas.reduce((acumulado, nomina) => {
        return acumulado + Number(nomina.nominaAPagar);
    }, 0);

    totalNominas.textContent = totalPagado.toLocaleString('es-CO', {
        maximumFractionDigits: 0
    })
}

/* MOSTRAR ULTIMAS 5 NÓMINAS */

function mostrarNominasRecientes(){

    //Limpiar la tabla
    tablaRecientes.innerHTML = '';

    //Mostrar mensaje sí no existen registros.
    if(nominas.length === 0){
        mensajeVacioRecientes.classList.remove('d-none');
        return;
    }

    mensajeVacioRecientes.classList.add('d-none');
    //Obtener las últimas cinco filas del arreglo de nóminas registradas.
    const recientes = nominas.slice(-5).reverse();

    recientes.forEach(nomina => {
        const empleado = nomina.empleado;

        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${escaparHTML(empleado.documento)}</td>
            
            <td>
                ${escaparHTML(empleado.nombre)}
                ${escaparHTML(empleado.apellido)}
            </td>

            <td>${escaparHTML(empleado.area)}</td>
            <td>${nomina.periodo}</td>
            <td class = "text-end fw-semibold">${formatearMoneda(nomina.nominaAPagar)}</td>
        `;

        tablaRecientes.appendChild(fila);
    });
}

/* INICIALIZAR EL PANEL */


/* Al cargar el documento, mostrar la fecha y actualizar los valores */
document.addEventListener('DOMContentLoaded', () =>{
    showDate();
    if(tablaRecientes){
        actualizarIndicadores();
        mostrarNominasRecientes();
    }
})



