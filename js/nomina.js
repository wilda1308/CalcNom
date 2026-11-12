const SMMLV = 1750000;
const AUXILIO_TRANSPORTE = 250000;
const limiteAuxilio = SMMLV * 2;
const HORA_MES = 240;   // Jornada de 8 horas laborales diarias (8 * 30) = 240 horas al mes.
const RECARGO_HED = 1.25; // recargo hora extra diurna: +25%
const REGARGO_HEN = 1.75; // recargo hora extra nocturna: +75%
const DESC_SALUD = 0.04; // 4 / 100 = 0.04
const DESC_PENSION = 0.04;



const formulario = document.getElementById('form-nomina');

const checkMasUnSalario = document.getElementById('mas-un-salario');

const checkPrestamo = document.getElementById('tiene-prestamo');
const contenedorPrestamo = document.getElementById('prestamos-container');
const montoPrestamo = document.getElementById('montoPrestamo');
const cuotasPrestamo = document.getElementById('cuotas');



function mostrarPrestamos(visible){
    montoPrestamo.value = '';
    cuotasPrestamo.value = '';
    
    contenedorPrestamo.style.display = visible ? '' : 'none';
    montoPrestamo.required = visible;
    cuotasPrestamo.required = visible;
}

const contenedorSalario = document.getElementById('contenedor-salarioBase');
const inputSalario = document.getElementById('salarioBasico');

function actualizarSalario(){
    const masDeUnSalario = checkMasUnSalario.checked;

    contenedorSalario.classList.toggle('d-none', !masDeUnSalario);
    inputSalario.disabled = !masDeUnSalario; //Campo disabled no se valida ni se envía
    inputSalario.value = '';
    mostrarError(inputSalario, '');
    inputSalario.setCustomValidity('');
}

checkMasUnSalario.addEventListener('change', actualizarSalario);

actualizarSalario();

checkPrestamo.addEventListener('change', () =>{
        mostrarPrestamos(checkPrestamo.checked);
});

function obtenerDatosFormulario() {

    const datos = Object.fromEntries(new FormData(formulario).entries());
    const tienePrestamo = checkPrestamo.checked;


    return {
        documento: datos.documento.trim(),
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        area: datos.area.trim(),

        salarioBase: checkMasUnSalario.checked ? leerNumero(datos.salarioBasico) : SMMLV,
        diasTrabajados: Number(datos.dias) || 0,
        horasExtrasDiurnas: Number(datos.hed) || 0,
        horasExtrasNocturnas: Number(datos.hen) || 0,

        comision: leerNumero(datos.comision),
        
        tienePrestamo: tienePrestamo,
        valorPrestamo: tienePrestamo ? leerNumero(datos.montoPrestamo) : 0,
        cuotasPrestamo: tienePrestamo ? Number(datos.cuotas) || 0 : 0
    }
}

const recibenComision = [
    'Ventas / Comercial',
    'Éxito del Cliente (Customer Success)',
    'Preventa e Ingeniería de Soluciones',
    'Marketing y Crecimiento (Growth)'
];

const seleccionArea = document.getElementById('area');
const seccionComisiones = document.getElementById('seccion-comision');

seleccionArea.addEventListener('change', function(){
    if(recibenComision.includes(this.value)){
        seccionComisiones.classList.remove('d-none');
    }else{
        seccionComisiones.classList.add('d-none');
        document.getElementById('comision').value = '';
    }
});

/* FUNCIONES PARA CALCULAR LA NOMINA Y ACCIONES DEL BOTÓN PRINCIPAL "SUBMIT" */

let ultimaNominaCalculada = null;

formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalidos = [...camposMoney].filter(campo => !validarMinimo(campo));
    if(invalidos.length > 0){
        invalidos[0].focus();
        return;
    }

    //Obtener los datos del formulario
    const datos = obtenerDatosFormulario();

    //Calcular la nómina
    const nomina = calcularNomina(datos);

    if(nomina.nominaAPagar <= 0){
        mostrarError(montoPrestamo, 'La cuota del préstamo es mayor a lo que recibe el empleado.');
        montoPrestamo.focus();
        return;
    }
    
    //Conservar el último calculo de nómina realizado.
    ultimaNominaCalculada = nomina;

    //Habilitar el bóton para guardar la nómina.
    document.getElementById('btn-guardar-nomina').disabled = false;

    //Mostrar los resultados (como desprendible al final de la página)
    mostrarResultado(nomina);

});


function calcularAuxilioTransporte(salarioBase, diasTrabajados){
    if(salarioBase > limiteAuxilio || diasTrabajados <= 0){
        return 0;
    }

    return Math.round((AUXILIO_TRANSPORTE / 30) * diasTrabajados);
}

function calcularDevengado(datos){
    const salarioBruto = Math.round((datos.salarioBase / 30) * datos.diasTrabajados);
    const auxilioTransporte = calcularAuxilioTransporte(datos.salarioBruto, datos.diasTrabajados);

    const valorHora = datos.salarioBase / HORA_MES;
    const horasExtraDiurnas = Math.round(valorHora * RECARGO_HED * datos.horasExtrasDiurnas);
    const horasExtraNocturnas = Math.round(valorHora * REGARGO_HEN * datos.horasExtrasNocturnas);

    const comision = datos.comision;

    // Base de salario (sin incluir auxilio de transporte)
    const baseCalculo = salarioBruto + horasExtraDiurnas + horasExtraNocturnas + comision;

    const total = baseCalculo + auxilioTransporte;

    return{
        salarioBruto,
        auxilioTransporte,
        horasExtraDiurnas,
        horasExtraNocturnas,
        comision,
        baseCalculo,
        total
    };
}

function calcularDeducciones(datos, devengado){
    const salud = Math.round(devengado.total * DESC_SALUD);
    const pension = Math.round(devengado.total * DESC_PENSION);

    const cuotaPrestamo = datos.tienePrestamo && datos.cuotasPrestamo > 0 ? Math.round(datos.valorPrestamo / datos.cuotasPrestamo) : 0;

    const total = salud + pension + cuotaPrestamo;

    return{
        salud,
        pension,
        cuotaPrestamo,
        total
    };

}


function calcularNomina(datos){
    const devengado = calcularDevengado(datos);
    const deducciones = calcularDeducciones(datos, devengado);
    const nominaAPagar = devengado.total - deducciones.total;

    return{
        empleado: datos, 
        devengado, 
        deducciones,
        nominaAPagar
    }
}

/* FUNCIONES PARA MOSTRAR CONTENIDO EN HTML (DOCUMENTO) */

const resultado = document.getElementById('resultado-nomina');

function formatoMoneda(valor){
    return '$ ' + valor.toLocaleString('es-CO', { maximumFractionDigits: 0});
}

//Evitamos que un nombre por ejemplo <b>Juan</b> se interprete como HTML
function escaparHTML(texto){
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
} 

function filaConcepto (nombre, valor, detalle = '', clase = ''){
    return `
        <div class="concepto ${clase}">
            <span>
                ${nombre}
                ${detalle ? `<small class="text-body-secondary d-block">${detalle}</small>` : ''}
            </span>
            <span class="concepto-valor">${formatoMoneda(valor)}</span>
        </div>
    `;
}

function datoEmpleado(etiqueta, valor){
    return`
        <div class="col-md-6">
            <small class="text-body-secondary d-block">${etiqueta}</small>
            <strong>${valor}</strong>
        </div>
    `
}

function mostrarResultado(nomina){
    const { empleado, devengado, deducciones, nominaAPagar} = nomina;

    /* ----- DATOS DEL EMPLEADO -----*/
    document.getElementById('datos-empleado-resultado').innerHTML = `
        <h3 class="resultado-titulo">Empleado</h3>
        <div class="row g-3">
            ${datoEmpleado('Nombre', `${escaparHTML(empleado.nombre)} ${escaparHTML(empleado.apellido)}`)}
            ${datoEmpleado('Documento', escaparHTML(empleado.documento))}
            ${datoEmpleado('Área', escaparHTML(empleado.area))}
            ${datoEmpleado('Días trabajados', empleado.diasTrabajados)}
        </div>`;

    /* ------ DEVENGADOS (SOLO SE MUESTRAN LOS QUE TIENEN VALOR) ------ */
    let devengados = filaConcepto('Salario bruto', devengado.salarioBruto, `${empleado.diasTrabajados} días trabajados`);

    if(devengado.auxilioTransporte > 0){
        devengados += filaConcepto('Auxilio de transporte', devengado.auxilioTransporte);
    }

    if(devengado.horasExtraDiurnas > 0){
        devengados += filaConcepto('Horas extra diurnas', devengado.horasExtraDiurnas, `${empleado.horasExtrasDiurnas} h`);
    }

    if(devengado.horasExtraNocturnas > 0){
        devengados += filaConcepto('Horas extra nocturnas', devengado.horasExtraNocturnas, `${empleado.horasExtrasNocturnas} h`);
    }

    if(devengado.comision > 0){
        devengados += filaConcepto('Comisión por ventas', devengado.comision);
    }

    devengados += filaConcepto('Total devengado', devengado.total, '', 'concepto-total');

    document.getElementById('devengados-resultado').innerHTML = `
        <h3 class = "resultado-titulo">Devengados</h3>
        ${devengados}`;
    
    /* ----- DEDUCCIONES ----- */
    let descuentos = filaConcepto('Salud', deducciones.salud, '4% del total devengado');
    descuentos += filaConcepto('Pensión', deducciones.pension, '4% del total devengado');

    if(deducciones.cuotaPrestamo > 0){
        descuentos+= filaConcepto('Cuota del préstamo', deducciones.cuotaPrestamo, `Préstamo de ${formatoMoneda(empleado.valorPrestamo)} en ${empleado.cuotasPrestamo} cuotas`);
    }
    descuentos += filaConcepto('Total deducciones', deducciones.total, '', 'concepto-total');

    document.getElementById('deducciones-resultado').innerHTML = `
        <h3 class = "resultado-titulo">Deducciones</h3>
        ${descuentos}
    `;

    /* ----- VALOR NETO A PAGAR AL EMPLEADO ----- */
    document.getElementById('total-resultado').innerHTML = `
        <div class="neto-box">
            <span>Valor total de nómina</span>
            <strong>${formatoMoneda(nominaAPagar)}</strong>
        </div>
    `;

    /* ----- MOSTRAR LA SECCIÓN Y BAJAR HASTA ELLA ----- */
    resultado.classList.remove('d-none');
    resultado.scrollIntoView({behavior:'smooth', block:'start'});
    
}

/* Capturar los campos númericos para convertir el punto por coma y colocar puntos como separador de miles */
const camposMoney = formulario.querySelectorAll('input[data-money]');

function leerNumero(texto){
    if(!texto) return 0;
    const numero = Number(texto.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(numero) ? numero : 0;
}

function formatearTexto(texto){
    const limpio = texto.replace(/[^\d,]/g, ''); // Eliminar todo excepto dígitos y coma
    const posComa = limpio.indexOf(','); // Posición de la coma decimal

    let entero = posComa === -1 ? limpio : limpio.slice(0, posComa); // Parte entera
    let decimales = posComa === -1 ? '' : limpio.slice(posComa + 1).replace(/,/g, '').slice(0, 2); // Limitar a 2 decimales

    entero = entero.replace(/^0+(?=\d)/, ''); // Eliminar ceros a la izquierda
    entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Agregar puntos como separador de miles

    return posComa === -1 ? entero : `${entero},${decimales}`;
}

function mostrarError(campo, mensaje){
    const contenedor = campo.closest('.campo');
    let aviso = contenedor.querySelector('.error');
    if(!aviso){
        aviso = document.createElement('small');
        aviso.className = 'error';
        contenedor.appendChild(aviso);
    }
    aviso.textContent = mensaje;
    campo.classList.toggle('invalido', Boolean(mensaje));
}

function validarMinimo(campo){
    const minimo = Number(campo.dataset.min);
    let mensaje = '';

    if(campo.value && Number.isFinite(minimo) && leerNumero(campo.value) < minimo){
        mensaje = `El valor mínimo es $ ${formatearTexto(String(minimo))}`;
    }

    campo.setCustomValidity(mensaje); // Establecer el mensaje de error personalizado
    mostrarError(campo, mensaje);
    return mensaje === '';
}

camposMoney.forEach(campo => {
    campo.addEventListener('input', (evento) => {
        let texto = campo.value;
        const cursor = campo.selectionStart; // Guardar la posición del cursor

        if(evento.data ==='.' && !texto.slice(0, cursor - 1).includes(',') && !texto.slice(cursor).includes(',')){ // Permitir un punto como separador decimal si no hay coma
            texto = texto.slice(0, cursor - 1) + ',' + texto.slice(cursor); // Reemplazar el punto por coma
        }

        // dígitos y comas antes del cursor(los puntos de miles no cuentan)
        const significativos = (texto.slice(0, cursor).match(/[\d,]/g) || []).length;

        const nuevo = formatearTexto(texto);
        campo.value = nuevo;

        //Restablecer la posición del cursor después de formatear el texto
        let pos = 0, vistos = 0;
        while(pos < nuevo.length && vistos < significativos){
            if(/[\d,]/.test(nuevo[pos])) vistos++;
            pos++;
        }

        campo.setSelectionRange(pos, pos); // Restaurar la posición del cursor

        campo.setCustomValidity(''); // Limpiar cualquier mensaje de error previo
        mostrarError(campo, ''); // Limpiar el mensaje de error visual
    });

    //Pegar "1750905.50" -> 1.750.905,50
    campo.addEventListener('paste', (evento) =>{
        const pegado = (evento.clipboardData || window.clipboardData).getData('text').trim();

        if(/^\d+\.\d{1,2}$/.test(pegado)){ // Si es un número con punto decimal
            evento.preventDefault();
            campo.setRangeText(pegado.replace('.', ','), campo.selectionStart, campo.selectionEnd, 'end'); // Reemplazar el texto seleccionado con el valor pegado
            campo.dispatchEvent(new Event('input', {bubbles: true})); // Disparar el evento de entrada para formatear el valor
        }
    });

    //Al salir: limpia y valida el valor mínimo que es 1750905
    campo.addEventListener('blur', () => {
        let valor = campo.value.replace(/,$/, ''); // Eliminar coma al final si existe
        if(valor.startsWith(',')) valor = '0' + valor; // Si empieza con coma, agregar un cero al inicio
        campo.value = valor;
        validarMinimo(campo);
    });
});

function limpiarFormulario(){
    resultado.classList.add('d-none');
    mostrarPrestamos(false);
    seccionComisiones.classList.add('d-none');
    camposMoney.forEach(campo => {
        campo.setCustomValidity('');
        mostrarError(campo, '')
    });
    ultimaNominaCalculada = null;
    btnGuardarNomina.disabled = true;
    checkMasUnSalario.checked = false;
    actualizarSalario();
}

formulario.addEventListener('reset', () => {
    limpiarFormulario();
});

/* SI SE ACTUALIZA ALGUN CAMPO, será necesario volver a calcular nuevamente */
formulario.addEventListener('input', () => {
    ultimaNominaCalculada = null;
    btnGuardarNomina.disabled = true;
})

/* GUARDAR NÓMINA CALCULADA SI EL USUARIO LO DESEA (CLIC GUARDAR) */
const btnGuardarNomina = document.getElementById('btn-guardar-nomina');

btnGuardarNomina.addEventListener('click', () => {
    //Verificar que exista un cálculo previo, si no no podemos guardar algo vacio.
    if(!ultimaNominaCalculada){
        return;
    }

    //Registrar la nomina en el arreglo y en el LocalStorage del navegador.
    const registro = registrarNomina(ultimaNominaCalculada);

    if(registro){
        alert('¡Nómina guardada correctamente!');
        formulario.reset();
    }
})
