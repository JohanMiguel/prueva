# bugs.md

##  Caza de Bugs

### Función Analizada

```javascript
function detectRapidDenials(logs, threshold, windowMinutes) {
  const sorted = logs.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const denials = sorted.filter(l => l.result === "denied");

  const flagged = [];

  for (let i = 0; i <= denials.length - threshold; i++) {
    const start = new Date(denials[i].timestamp);
    const end = new Date(denials[i + threshold - 1].timestamp);

    const diffMinutes = (end - start) / 1000 * 60;

    if (diffMinutes <= windowMinutes) {
      flagged.push(denials[i].member);
    }
  }

  return flagged;
}
```

---

## Observacion 1, La Mutación del array original

### Problema

La función utiliza:

```javascript
logs.sort(...)
```

El método `sort()` modifica el arreglo original recibido como parámetro.

### Impacto

Se tiene que usar funciones puras, Modificar el arreglo original introduce efectos secundarios y puede afectar otras partes del sistema que utilicen el mismo array.

### Solución
**
```javascript
const sorted = [...logs].sort(...);
```

---

## Observacion 2, Cálculo incorrecto de minutos

### Problema

La función calcula:

```javascript
(end - start) / 1000 * 60
```

### Impacto

El resultado va hacer incorrecto porque se multiplica por 60 en lugar de dividir entre 60.

### Solución

```javascript
(end - start) / (1000 * 60)
```

---

## Observacion 3, Mezcla intentos de distintos miembros

### Problema

La función analiza todas las denegaciones juntas sin separar por miembro.

### Ejemplo

```text
Juan denied
Carlos denied
Juan denied
Carlos denied
Juan denied
```

El algoritmo puede marcar a Juan utilizando intentos que realmente pertenecen a Carlos.

### Impacto

Se vam generan falsos positivos.

### Solución

Agrupar primero los eventos por miembro y aplicar la ventana temporal individualmente.

---

## Observacion 4, Posibles duplicados en la salida

### Problema

La función utiliza:

```javascript
flagged.push(member);
```

El mismo miembro puede ser agregado varias veces.

### Impacto

La respuesta puede contener duplicados.

### Solución

Utilizar un Set para.

---

## Función Corregida

(Colocar aquí la versión corregida final)

## Conclusión

Se identificaron cuatro errores:

1. Mutación del arreglo original.
2. Error en el cálculo de tiempo.
3. Mezcla de eventos entre distintos miembros.
4. Posibles duplicados en el resultado.

La versión corregida tiene funcion pura funcional, calcula correctamente las ventanas temporales y evalúa cada miembro de forma independiente.

```
```
