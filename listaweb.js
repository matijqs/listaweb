document.getElementById('searchButton').addEventListener('click', realizarBusqueda);
document.getElementById('medidaInput').addEventListener('keydown', function(event) {
    if (event.key === "Enter") {       
        realizarBusqueda();
    }
});

function realizarBusqueda() {
    const medidaBuscada = document.getElementById('medidaInput').value.trim();

    console.log('Buscando medida:', medidaBuscada); // Log para verificar la entrada

    if (!medidaBuscada) {
        alert("Por favor, ingresa una medida válida.");
        return;
    }

    cargarArchivo(medidaBuscada);
}

function cargarArchivo(medidaBuscada) {
    fetch('LISTA DE PRECIOS WEB.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets["Hoja1"];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            console.log('Datos JSON:', jsonData); // Log para verificar los datos

            const variantes = GenerarVariantesMedida(medidaBuscada);
            console.log('Variantes generadas:', variantes); // Log para verificar variantes

            const resultados = jsonData.filter(row =>
                variantes.some(vari => row["MEDIDA"] && row["MEDIDA"].toString().toUpperCase().includes(vari.toUpperCase()))
            );

            console.log('Resultados encontrados:', resultados); // Log para verificar los resultados

            const resultadosDiv = document.getElementById('resultados');
            resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores

            const encabezado = document.createElement('h3');
            encabezado.textContent = "Tenemos lo siguiente:";
            resultadosDiv.appendChild(encabezado);

            if (resultados.length > 0) {
                resultados.forEach(fila => {
                    const sku = fila["SKU"] || '';
                    const medida = fila["MEDIDA"] || '';
                    const marca = fila["MARCA"] || '';
                    const modelo = fila["MODELO"] || '';
                    const precioWeb = fila["WEB"] || '';

                    function formatearPrecio(precio) {
                        if (!precio) return '';
                        return precio.toLocaleString('es-ES');
                    }

                    const precioWebFormateado = formatearPrecio(precioWeb);

                    let resultadoTexto = `
                        <input type="checkbox" class="resultado-checkbox">
                        Medida: ${medida}<br>
                        Marca: ${marca}<br>
                        Modelo: ${modelo}<br>
                        Precio unitario: $${precioWebFormateado}`;

                    const resultadoElemento = document.createElement('div');
                    resultadoElemento.classList.add('alert', 'alert-info');
                    resultadoElemento.innerHTML = resultadoTexto;
                    resultadosDiv.appendChild(resultadoElemento);
                });

                document.getElementById('copyButton').style.display = 'block';
                document.getElementById('copySelectedButton').style.display = 'block'; // Mostrar el botón de copiar seleccionados
            } else {
                const resultadoElemento = document.createElement('p');
                resultadoElemento.classList.add('alert', 'alert-warning');
                resultadoElemento.textContent = `No se encontraron neumáticos que contengan la medida "${medidaBuscada}".`;
                resultadosDiv.appendChild(resultadoElemento);

                document.getElementById('copyButton').style.display = 'none';
                document.getElementById('copySelectedButton').style.display = 'none'; // Ocultar el botón de copiar seleccionados
            }
        })
        .catch(error => console.error('Error al cargar el archivo:', error));
}

function GenerarVariantesMedida(medida) {
    medida = medida.toString().trim();

    if (medida.length === 7) {
        const ancho = medida.substring(0, 3);
        const perfil = medida.substring(3, 5);
        const diametro = medida.substring(5);

        return [
            `${ancho}/${perfil}R${diametro}`,
            `${ancho}/${perfil}ZR${diametro}`,
            `${ancho}/${perfil}ZRZ${diametro}`,
            `${ancho}/${perfil}RZR${diametro}`,
            `${ancho}/${perfil}R${diametro}C`,
            `${ancho}/${perfil}ZR${diametro}C`,
            `${ancho}/${perfil}ZRF${diametro}`,
            `${ancho}/${perfil}ZRXL${diametro}`,
            `${ancho}/${perfil}ZRF${diametro}C`
        ];
    }

    if (medida.length === 5) {
        const ancho = medida.substring(0, 3);
        const diametro = medida.substring(3);

        return [
            `${ancho}R${diametro}`,
            `${ancho}R${diametro}C`,
            `${ancho}ZR${diametro}`,
            `${ancho}ZR${diametro}C`,
            `${ancho}ZRF${diametro}`
        ];
    }

    if (medida.includes("/") || medida.includes("R") || medida.includes("Z")) {
        return [medida];
    }

    return [medida];
}

document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = 'Tenemos lo siguiente:\n\n';

    const alertElements = resultadosDiv.getElementsByClassName('alert');

    for (let i = 0; i < alertElements.length; i++) {
        const alertElement = alertElements[i];
        const lines = alertElement.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    }

    resultadosTexto = resultadosTexto.trim();
    navigator.clipboard.writeText(resultadosTexto);
});

document.getElementById('copySelectedButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';

    // Añadir el texto del encabezado
    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) {
        resultadosTexto += encabezado.innerText + '\n\n';
    }

    const checkboxes = resultadosDiv.querySelectorAll('.resultado-checkbox:checked');

    if (checkboxes.length === 0) {
        alert("Selecciona al menos un resultado para copiar.");
        return;
    }

    checkboxes.forEach(checkbox => {
        const resultadoElemento = checkbox.closest('.alert');
        if (resultadoElemento) {
            const lines = resultadoElemento.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
            resultadosTexto += lines.join('\n') + '\n\n';
        }
    });

    resultadosTexto = resultadosTexto.trim();
    navigator.clipboard.writeText(resultadosTexto);
});
