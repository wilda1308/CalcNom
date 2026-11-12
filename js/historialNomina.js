/* ALMACENAMIENTO DE NÓMINAS CON LOCALSTORAGE */
// Nombre de propiedad donde se almacenarán los registros (al darle al botón guardar).
const CLAVE_NOMINAS = 'calcnom_nominas';

//Cargaremos las nóminas almacenadas en el LocalStorage
function cargarNominas(){
    const datosGuardados = localStorage.getItem(CLAVE_NOMINAS);

    // Si está vacio no recuperamos ningun arreglo
    if(!datosGuardados){
        return [];
    }

    try{
        //Comprobar que sean arreglos y almacenarlos en una nueva variable
        const nominasGuardadas = JSON.parse(datosGuardados);

        return Array.isArray(nominasGuardadas) ? nominasGuardadas: [];
    } catch (error){
        console.error('Error al cargar las nóminas: ', error);
        return [];
    }
}

//Arreglo principal de nóminas para el historial
let nominas = cargarNominas();

//Guardar el arreglo actualizado de forma dinámica en LocalStorage, en caso de recargar la página se mantendra el arreglo del LocalStorage
function guardarNominas(){
    localStorage.setItem(CLAVE_NOMINAS, JSON.stringify(nominas));
}

//Registrar una nueva nómina calculada(al darle al botón guardar)
function registrarNomina(resultado){
    const fecha = new Date();

    //Generar un identificador consecutivo (como una base de datos), en caso de no obtener el ultimo valor del id, es decir que es el primer registro.
    const nuevoId = nominas.length > 0 ? Math.max(...nominas.map(n => n.id)) + 1 : 1;

    //Crear el objeto que representa la nómina, incluyendo el id. Para mostrar en el historial (solo los datos necesarios).
    const nuevoRegistro = {
        id: nuevoId,
        fechaRegistro: fecha.toLocaleDateString('es-CO'),
        periodo: fecha.toLocaleDateString('es-CO', {
            month: 'long',
            year: 'numeric'
        }),

        empleado: resultado.empleado,
        devengado: resultado.devengado.total,
        deducciones: resultado.deducciones.total,
        nominaAPagar: resultado.nominaAPagar
    }

    //Agregar el registro al arreglo
    nominas.push(nuevoRegistro);

    //Actualizar el LocalStorage
    guardarNominas();

    return nuevoRegistro;
}

