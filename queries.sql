-- =====================================================
-- Query 1
-- Obtener los miembros con más de 3 accesos denegados,
-- ordenados de mayor a menor.
-- =====================================================

SELECT
member,
COUNT(*) AS denials
FROM access_logs
WHERE LOWER(result) = 'denied'
GROUP BY member
HAVING COUNT(*) > 3
ORDER BY denials DESC;

-- =====================================================
-- Query 2
-- Promedio de accesos por hora durante las últimas 24 horas.
-------------------------------------------------------------

-- Se asume:
-- access_logs(
--   id,
--   member,
--   action,
--   result,
--   logged_at TIMESTAMP
-- )
-- =====================================================

SELECT
EXTRACT(HOUR FROM logged_at) AS hour_of_day,
COUNT(*) AS accesses
FROM access_logs
WHERE logged_at >= NOW() - INTERVAL '24 HOURS'
GROUP BY EXTRACT(HOUR FROM logged_at)
ORDER BY hour_of_day;

-- =====================================================
-- Query 3 
-- Detectar intentos consecutivos del mismo miembro.
----------------------------------------------------

-- Se utiliza una window function para comparar
-- cada registro con el inmediatamente anterior.
-- =====================================================

SELECT
member,
logged_at,
result,
LAG(result) OVER (
PARTITION BY member
ORDER BY logged_at
) AS previous_result
FROM access_logs
ORDER BY member, logged_at;

-- =====================================================
-- Query 3  
-- Mostrar únicamente los casos donde existen
-- dos denegaciones consecutivas.
-- =====================================================

WITH ordered_logs AS (
SELECT
member,
logged_at,
result,
LAG(result) OVER (
PARTITION BY member
ORDER BY logged_at
) AS previous_result
FROM access_logs
)
SELECT
member,
logged_at,
result
FROM ordered_logs
WHERE
LOWER(result) = 'denied'
AND LOWER(previous_result) = 'denied'
ORDER BY member, logged_at;