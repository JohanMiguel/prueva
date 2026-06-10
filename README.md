# Kiosco Logs - Node.js Backend

Backend especializado en Node.js para análisis de logs de acceso a kioscos. Implementado con Express.js, CORS, logging de peticiones y validación robusta de datos.

## Requisitos Técnicos Implementados

✅ **Servidor Express en puerto 3000**  
✅ **Lógica (analyzer) separada del servidor**  
✅ **Rutas no definidas responden 404 con JSON claro**  
✅ **CORS habilitado para cualquier origen**  
✅ **Logger de peticiones con Morgan**  
✅ **Manejo de errores básico sin stack traces crudos**  
✅ **Validación de datos con normalización**

## Funciones Implementadas

### 1. `getMembersWithMostDenials(logs, topNque)`

Cuenta los accesos denegados por miembro y devuelve los top N ordenados de mayor a menor.

**Parámetros:**
- `logs`: Array de entradas de log
- `topNque`: Número máximo de miembros a devolver (default: 5)

**Retorna:** `Array<{member: string, denials: number}>`

**Ejemplo con logs.json:**
```bash
curl "http://localhost:3000/members/most-denials?topN=3"
```

**Respuesta Esperada:**
```json
{
  "topNque": 3,
  "members": [
    { "member": "Juan Pérez", "denials": 4 },
    { "member": "Carlos Gómez", "denials": 3 },
    { "member": "Ana Martínez", "denials": 1 }
  ]
}
```

---

### 2. `getHourlyBreakdown(logs)`

Devuelve un objeto donde las llaves son las horas del día (0–23) y los valores son la cantidad total de accesos en esa hora, sin importar el día ni el resultado. **Solo incluye las horas que tienen al menos un acceso.**

**Parámetros:**
- `logs`: Array de entradas de log

**Retorna:** `Object<hour: string, count: number>`

**Ejemplo:**
```bash
curl "http://localhost:3000/hourly-breakdown"
```

**Respuesta esperada (con logs.json limpio):**
```json
{
  "breakdown": {
    "8": 4,
    "9": 5,
    "10": 3
  }
}
```

**Conteo manual verificado:**
- Hora 8: IDs 1, 2, 3, 4 = 4 accesos
- Hora 9: IDs 5, 6, 7, 8, 9 = 5 accesos
- Hora 10: IDs 10, 11, 12 = 3 accesos

---

### 3. `getSuspiciousActivity(logs, maxAttempts, windowMinutes)`

Detecta miembros que tuvieron `maxAttempts` o más intentos en un periodo de `windowMinutes` minutos. Devuelve detalles completos de cada incidente (miembro, cantidad de intentos, hora de inicio y fin).

**Parámetros:**
- `logs`: Array de entradas de log
- `maxAttempts`: Número máximo de intentos (default: 5)
- `windowMinutes`: Ventana de tiempo en minutos (default: 5)

**Retorna:** `Array<{member: string, attempts: number, startTime: string, endTime: string}>`

**Ejemplo:**
```bash
curl "http://localhost:3000/suspicious?maxAttempts=3&windowMinutes=2"
```

**Respuesta:**
```json
{
  "maxAttempts": 3,
  "windowMinutes": 2,
  "incidents": [
    {
      "member": "Carlos Gómez",
      "attempts": 3,
      "startTime": "2026-06-01T10:00:00Z",
      "endTime": "2026-06-01T10:02:00Z"
    }
  ]
}
```

---

## Estructura del Proyecto

```
kiosco-logs/
├── package.json          # Dependencias y scripts
├── logs.json             # Datos limpios para análisis
├── logs_dirty.json       # Datos sucios (ejemplos de validación)
├── queries.sql           # Consultas SQL de referencia
├── bugs.md               # Reporte de bugs
├── README.md             # Este archivo
└── src/
    ├── analyzer.js       # Funciones de análisis (lógica pura)
    └── server.js         # Servidor Express con rutas
```

## Instalación y Setup

### 1. Clonar o descargar el proyecto

```bash
cd kiosco-logs
```

### 2. Instalar dependencias

```bash
npm install
```

Las dependencias incluyen:
- `express`: ^5.2.1 - Framework web
- `cors`: ^2.8.5 - Habilitar CORS
- `morgan`: ^1.10.0 - Logger de peticiones HTTP

### 3. Iniciar el servidor

```bash
npm start
```

**Salida esperada:**
```
kiosco-logs server listening on port 3000
```

### 4. Pruebas rápidas

Con el servidor en ejecución, prueba las rutas:

#### Miembros con más denegaciones (top 3):
```bash
curl "http://localhost:3000/members/most-denials?topN=3"
```

#### Desglose por hora:
```bash
curl "http://localhost:3000/hourly-breakdown"
```

#### Actividad sospechosa:
```bash
curl "http://localhost:3000/suspicious?maxAttempts=3&windowMinutes=2"
```

#### Ruta no definida (404):
```bash
curl "http://localhost:3000/invalid-route"
```

**Respuesta:**
```json
{ "error": "Not Found", "path": "/invalid-route" }
```

---

## Características Técnicas

### Validación de Datos

- Normalización de campos (`trim()`, `toLowerCase()`)
- Filtrado de entries inválidas (miembros vacíos, timestamps no parseables)
- Manejo de valores case-insensitive (`"DENIED"`, `"denied"`, etc.)
- Protección contra valores `null`, `undefined` y tipos incorrectos

### Manejo de Errores

- Try-catch en cada ruta para evitar crashes
- Respuestas JSON consistentes con status HTTP apropiados
- Logs en consola para debugging
- Sin exposición de stack traces en cliente

### Logging

Morgan registra cada petición HTTP:
```
::ffff:127.0.0.1 - - [10/Jun/2026:22:46:19 +0000] "GET /members/most-denials?topN=3 HTTP/1.1" 200 ...
```

---

## Datos de Ejemplo (logs.json)

El archivo incluye 12 entradas de ejemplo:

```json
[
  {"id":1,"member":"Juan Pérez","action":"check-in","result":"denied","timestamp":"2026-06-01T08:01:00Z"},
  {"id":2,"member":"María López","action":"check-in","result":"granted","timestamp":"2026-06-01T08:05:00Z"},
  ...
]
```

**Estadísticas:**
- **Juan Pérez**: 4 denegaciones (08:01, 08:02, 09:02, 09:03)
- **Carlos Gómez**: 3 denegaciones (10:00, 10:01, 10:02)
- **Ana Martínez**: 1 denegación (09:05)

---

## Desarrollo

### Ejecutar pruebas manuales

Usa Thunder Client, Postman o cURL para probar las rutas.

### Agregar nuevas funciones

1. Implementa la lógica en `src/analyzer.js`
2. Exporta desde `module.exports`
3. Importa en `src/server.js`
4. Crea la ruta GET correspondiente
5. Envuelve en try-catch para manejo de errores

Ejemplo:

```javascript
// En analyzer.js
function myNewAnalysis(logs) {
  // lógica
  return results;
}
module.exports = { ..., myNewAnalysis };

// En server.js
const { myNewAnalysis } = require('./analyzer');
app.get('/my-endpoint', (req, res) => {
  try {
    const logs = loadLogs();
    const results = myNewAnalysis(logs);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed', detail: err.message });
  }
});
```

---

## Variables de Entorno

Puedes configurar el puerto con:

```bash
PORT=8000 npm start
```

Por defecto usa `3000`.

---

## Troubleshooting

### Error: "Unexpected end of JSON input"
- Verifica que `logs.json` sea JSON válido: `node -e "JSON.parse(require('fs').readFileSync('logs.json','utf8'))"`

### Puerto 3000 ya en uso
- Cambia el puerto: `PORT=3001 npm start`

### Rutas devuelven array vacío
- Verifica que `logs.json` contenga datos
- Revisa la consola para logs de error

---

## Licencia

ISC

---

**Última actualización:** 2026-06-10
