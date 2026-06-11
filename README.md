# Decisiones de Implementación

## Vía Elegida

Utilize la **Vía B** para apoyar tareas de revisión, análisis y validación de soluciones.

La implementación, validación de resultados, corrección de errores y decisiones técnicas fueron revisadas manualmente antes de incorporarlo al proyecto.

---

## Ambigüedades Detectadas

### Interpretación de `maxAttempts`

El enunciado indica:

> "más de maxAttempts intentos dentro de windowMinutes"

Al revisar los ejemplos de la prueba, se observó que un usuario es marcado como sospechoso incluso cuando alcanza exactamente la cantidad de intentos indicada en `maxAttempts`.

Debido a esto, se optó por considerar el umbral como inclusivo (`>=`) en lugar de exigir que lo supere (`>`), ya que esta interpretación coincide mejor con los resultados esperados.

```javascript
attempts >= maxAttempts
```

en lugar de:

```javascript
attempts > maxAttempts
```

---

### Promedio de accesos por hora (SQL)

La descripción puede interpretarse de distintas formas:

* Cantidad total de accesos agrupados por hora.
* Promedio histórico por hora del día.
* Promedio dentro de una ventana de 24 horas.

Para la solución se asumió una agrupación por hora dentro de las últimas 24 horas.

---

## Política para logs_dirty.json

Durante el procesamiento de datos se aplicaron las siguientes reglas:

### Miembros inválidos

Se ignoran registros donde:

* `member` sea nulo.
* `member` sea una cadena vacía.
* `member` contenga únicamente espacios.

### Timestamps inválidos

Se descartan registros cuyo timestamp no pueda convertirse a una fecha válida mediante:

```javascript
Date.parse(...)
```

### Resultados inconsistentes

Los valores de resultado se normalizan utilizando:

```javascript
String(result).toLowerCase()
```

permitiendo procesar correctamente variantes como:

```text
DENIED
Denied
denied
```

### Registros incompletos

Cualquier entrada que no contenga la información mínima requerida para el análisis es ignorada.

Esta estrategia evita fallos de ejecución y mantiene consistencia en los resultados.

---

## Uso de Ventana Deslizante (Sliding Window)

La función `getSuspiciousActivity()` utiliza la técnica conocida como Sliding Window.

### Motivación

Permite detectar múltiples intentos realizados dentro de una ventana temporal sin necesidad de comparar cada evento contra todos los demás.

### Funcionamiento

Para cada miembro:

1. Se ordenan cronológicamente los eventos.
2. Se mantienen dos índices:

   * left
   * right
3. La ventana se expande hacia adelante.
4. Cuando la diferencia temporal supera el límite configurado, el índice izquierdo avanza.

### Complejidad

* Ordenamiento: O(n log n)
* Recorrido de ventana: O(n)

Esto resulta considerablemente más eficiente que una solución O(n²).

---

## Prompt Utilizado con IA

Ejemplo de prompt utilizado durante el desarrollo:

> Actúa como un Senior Backend Engineer especializado en Node.js y Express. Analiza el código, identifica problemas de diseño, valida complejidad temporal, detecta errores de lógica y propone mejoras alineadas con buenas prácticas de ingeniería de software.

Las sugerencias obtenidas fueron revisadas y adaptadas antes de su incorporación.

---

## Mejoras Futuras

Si se dispusiera de más tiempo, se implementarían las siguientes mejoras:

### Pruebas automatizadas

* Unit tests para analyzer.js.
* Casos borde para logs inválidos.
* Verificación de pureza de funciones.

### Procesamiento de grandes volúmenes

Para millones de registros:

* Lectura mediante streams.
* Procesamiento incremental.
* Agregaciones parciales en memoria.

### Configuración externa

Mover parámetros como:

* maxAttempts
* windowMinutes
* topN

a variables de entorno o archivos de configuración.

### Observabilidad

Agregar:

* métricas
* trazabilidad
* monitoreo

para facilitar la operación en producción.

### Optimización de carga

Actualmente el archivo se lee en cada petición.

Una posible mejora sería:

* cachear los datos en memoria.
* invalidar la caché cuando cambie el archivo.

Esto reduciría operaciones de I/O y mejoraría el rendimiento.
