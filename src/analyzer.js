("use strict");

/**
 * Analyzer utilities for kiosco-logs
 * Functions are written with input validation and documented return values.
 */

/**
 * Cuenta los accesos denegados por miembro y devuelve los top N ordenados desc.
 * @param {Array} logs - Array de entradas de log
 * @param {number} topNque - Número máximo de miembros a devolver
 * @returns {Array<{member: string, denials: number}>}
 */
function getMembersWithMostDenials(logs, topNque = 5) {
	if (!Array.isArray(logs)) return [];
	const counts = Object.create(null);

	for (const entry of logs) {
		if (!entry || typeof entry.member !== 'string') continue;
		const member = entry.member.trim();
		if (!member) continue;
		const result = (entry.result || '').toString().toLowerCase();
		if (result === 'denied') {
			counts[member] = (counts[member] || 0) + 1;
		}
	}

	return Object.keys(counts)
		.map((member) => ({ member, denials: counts[member] }))
		.sort((a, b) => b.denials - a.denials)
		.slice(0, Math.max(0, parseInt(topNque, 10) || 0));
}

/**
 * Devuelve un objeto donde las llaves son las horas del día (como strings "0"-"23") 
 * y los valores son la cantidad total de accesos en esa hora, sin importar el día ni el resultado.
 * Solo incluye las horas que tienen al menos un acceso.
 * @param {Array} logs
 * @returns {Object<string, number>}
 */
function getHourlyBreakdown(logs) {
	const result = {};

	if (!Array.isArray(logs)) return result;

	for (const entry of logs) {
		if (!entry || !entry.timestamp) continue;
		const d = new Date(entry.timestamp);
		if (Number.isNaN(d.getTime())) continue;
		const hour = String(d.getUTCHours());
		result[hour] = (result[hour] || 0) + 1;
	}

	return result;
}

/**
 * Detecta miembros con `maxAttempts` o más intentos dentro de `windowMinutes` minutos.
 * Devuelve objetos con detalles de cada incidente.
 * @param {Array} logs
 * @param {number} maxAttempts
 * @param {number} windowMinutes
 * @returns {Array<{member: string, attempts: number, startTime: string, endTime: string}>}
 */
function getSuspiciousActivity(logs, maxAttempts = 5, windowMinutes = 5) {
	if (!Array.isArray(logs)) return [];
	const byMember = Object.create(null);

	for (const entry of logs) {
		if (!entry || typeof entry.member !== 'string') continue;
		const member = entry.member.trim();
		if (!member || !entry.timestamp) continue;
		const t = Date.parse(entry.timestamp);
		if (Number.isNaN(t)) continue;
		(byMember[member] = byMember[member] || []).push({ ts: t, timestamp: entry.timestamp });
	}

	const windowMs = Math.max(0, Number(windowMinutes)) * 60 * 1000;
	const incidents = [];
	const seen = new Set();

	for (const [member, events] of Object.entries(byMember)) {
		events.sort((a, b) => a.ts - b.ts);
		let left = 0;
		for (let right = 0; right < events.length; right++) {
			while (left < right && events[right].ts - events[left].ts > windowMs) left++;
			const attempts = right - left + 1;
			if (attempts >= maxAttempts) {
				const key = `${member}:${left}:${right}`;
				if (!seen.has(key)) {
					seen.add(key);
					incidents.push({
						member,
						attempts,
						startTime: events[left].timestamp,
						endTime: events[right].timestamp
					});
				}
				break;
			}
		}
	}

	return incidents;
}

function detectRapidDenials(logs, threshold = 3, windowMinutes = 5) {
  if (!Array.isArray(logs)) return [];

  threshold = Math.max(1, Number(threshold) || 1);
  windowMinutes = Math.max(0, Number(windowMinutes) || 0);

  // Filtrar denials válidos, parsear timestamp a ms y no mutar el array original
  const denials = logs
    .filter(l => l && typeof l.member === 'string' && (String(l.result) || '').trim().toLowerCase() === 'denied' && l.timestamp)
    .map(l => ({ ...l, ts: Date.parse(l.timestamp) }))
    .filter(l => !Number.isNaN(l.ts))
    .sort((a, b) => a.ts - b.ts);

  const flagged = new Set();
  const windowMs = windowMinutes * 60 * 1000;

  for (let i = 0; i <= denials.length - threshold; i++) {
    const start = denials[i].ts;
    const end = denials[i + threshold - 1].ts;
    const diffMinutes = (end - start) / (1000 * 60);
    if (diffMinutes <= windowMinutes) {
      flagged.add(denials[i].member.trim());
    }
  }

  return Array.from(flagged);
}
module.exports = {
	getMembersWithMostDenials,
	getHourlyBreakdown,
	getSuspiciousActivity,
};

