/**
 * CONFESIONARIO ANÓNIMO DE LILEYA_MC — app.js
 * Lógica del formulario + medidas de seguridad en cliente.
 */

'use strict';

/* ── CONFIGURACIÓN ─────────────────────────────────────────── */
const SCRIPT_URL   = 'https://script.google.com/macros/s/AKfycbwbq0AvLedkSaZ6bEaT_xsIiPtDH8Hx7DfRg9q9RM9IDWM69bmf-MzVCc-uqUYLXt5Twg/exec';
const MIN_CHARS    = 10;      // mínimo de caracteres requeridos
const MAX_CHARS    = 1000;    // máximo de caracteres permitidos
const COOLDOWN_SEC = 30;      // segundos de espera entre envíos

/* ── FONDO DE NUBES ────────────────────────────────────────── */
document.documentElement.style.setProperty(
    '--fondo-imagen-url',
    'url("nube-removebg-preview.png")'
);

/* ── PARTÍCULAS FLOTANTES ──────────────────────────────────── */
(function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const emojis = ['✨', '🌸', '💫', '⭐', '🔮', '💜', '🌙', '🦋'];

    function spawnParticle() {
        const el = document.createElement('span');
        el.className = 'particle';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        const leftPct  = Math.random() * 100;
        const duration = 8 + Math.random() * 14;   // 8–22 s
        const delay    = Math.random() * 10;         // 0–10 s
        const size     = 0.9 + Math.random() * 1;   // 0.9–1.9 rem

        el.style.cssText = `
            left: ${leftPct}%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            font-size: ${size}rem;
        `;
        container.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }

    // Arrancar con algunas partículas ya en pantalla
    for (let i = 0; i < 8; i++) spawnParticle();
    setInterval(spawnParticle, 1800);
})();

/* ── UTILIDADES DE SEGURIDAD ───────────────────────────────── */

/**
 * Elimina etiquetas HTML y scripts del texto del usuario.
 * Previene inyección de HTML/XSS en caso de que el servidor
 * refleje el texto sin escapar.
 */
function sanitizeInput(text) {
    return text
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')          // quitar cualquier tag HTML
        .replace(/javascript:/gi, '')      // quitar proto js:
        .replace(/on\w+\s*=/gi, '')        // quitar event handlers inline
        .trim();
}

/**
 * Validación básica antes de enviar.
 * Retorna { ok: boolean, message: string }
 */
function validateInput(text) {
    if (text.length < MIN_CHARS) {
        return { ok: false, message: `Tu confesión debe tener al menos ${MIN_CHARS} caracteres. ¡Suéltalo todo! 😤` };
    }
    if (text.length > MAX_CHARS) {
        return { ok: false, message: `Máximo ${MAX_CHARS} caracteres. ¡Sé conciso! 🤏` };
    }
    // Detectar si solo hay espacios / emojis sin contenido real
    if (text.replace(/\s/g, '').length < 5) {
        return { ok: false, message: 'Escribe algo de verdad, ¡no te me escapes! 🧐' };
    }
    return { ok: true, message: '' };
}

/* ── RATE LIMITING (cliente) ───────────────────────────────── */
let lastSubmitTime   = 0;
let cooldownInterval = null;

function isOnCooldown() {
    return (Date.now() - lastSubmitTime) < COOLDOWN_SEC * 1000;
}

function getRemainingSeconds() {
    return Math.ceil((COOLDOWN_SEC * 1000 - (Date.now() - lastSubmitTime)) / 1000);
}

function startCooldownUI() {
    const badge = document.getElementById('cooldownBadge');
    const label = document.getElementById('cooldownLabel');
    const btn   = document.getElementById('submitBtn');

    if (!badge || !label || !btn) return;

    btn.disabled = true;
    badge.classList.add('visible');

    function tick() {
        const remaining = getRemainingSeconds();
        if (remaining <= 0) {
            clearInterval(cooldownInterval);
            cooldownInterval = null;
            btn.disabled = false;
            badge.classList.remove('visible');
        } else {
            label.textContent = `Podrás confesar de nuevo en ${remaining}s`;
        }
    }

    tick();
    cooldownInterval = setInterval(tick, 500);
}

/* ── BARRA DE CARACTERES ───────────────────────────────────── */
function initCharCounter() {
    const textarea = document.getElementById('texto_entrada_id');
    const fill     = document.getElementById('charBarFill');
    const counter  = document.getElementById('charCounter');
    if (!textarea || !fill || !counter) return;

    textarea.addEventListener('input', () => {
        const len  = textarea.value.length;
        const pct  = Math.min((len / MAX_CHARS) * 100, 100);

        fill.style.width = pct + '%';
        counter.textContent = `${len} / ${MAX_CHARS}`;

        fill.className    = 'char-bar-fill';
        counter.className = 'char-count';

        if (pct >= 90) {
            fill.classList.add('danger');
            counter.classList.add('danger');
        } else if (pct >= 70) {
            fill.classList.add('warn');
            counter.classList.add('warn');
        }
    });
}

/* ── CONFETI ───────────────────────────────────────────────── */
function launchConfetti() {
    const colors = ['#884e96', '#eb598e', '#ffd981', '#c2f8f9', '#f0a2d6'];
    for (let i = 0; i < 60; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.cssText = `
            left: ${Math.random() * 100}vw;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            width:  ${6 + Math.random() * 8}px;
            height: ${6 + Math.random() * 8}px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            animation-duration: ${2 + Math.random() * 3}s;
            animation-delay: ${Math.random() * 0.8}s;
        `;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }
}

/* ── FEEDBACK ──────────────────────────────────────────────── */
function showFeedback(message, type) {
    const el = document.getElementById('feedback');
    if (!el) return;

    el.textContent  = message;
    el.className    = `${type} visible`;

    // Scroll suave hacia el feedback
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFeedback() {
    const el = document.getElementById('feedback');
    if (el) { el.className = ''; el.textContent = ''; }
}

/* ── LOADING OVERLAY ───────────────────────────────────────── */
function setLoading(visible) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    if (visible) overlay.classList.add('visible');
    else         overlay.classList.remove('visible');
}

/* ── SUBMIT ────────────────────────────────────────────────── */
function initForm() {
    const form = document.getElementById('dataForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideFeedback();

        // ── Verificar cooldown ──────────────────────────────
        if (isOnCooldown()) {
            showFeedback(`⏳ Espera ${getRemainingSeconds()}s antes de volver a confesar.`, 'error');
            return;
        }

        // ── Obtener y sanitizar texto ───────────────────────
        const textarea  = document.getElementById('texto_entrada_id');
        const rawText   = textarea.value;
        const cleanText = sanitizeInput(rawText);

        // ── Validar ─────────────────────────────────────────
        const validation = validateInput(cleanText);
        if (!validation.ok) {
            showFeedback('⚠️ ' + validation.message, 'error');
            textarea.focus();
            return;
        }

        // ── Enviar ──────────────────────────────────────────
        setLoading(true);
        const btn = document.getElementById('submitBtn');
        if (btn) btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('texto_entrada', cleanText);

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body:   formData
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (data.result === 'success') {
                lastSubmitTime = Date.now();
                launchConfetti();
                showFeedback('✅ ¡Confesión enviada y guardada anónimamente! 🤫', 'success');
                form.reset();
                // Resetear barra de caracteres
                const fill    = document.getElementById('charBarFill');
                const counter = document.getElementById('charCounter');
                if (fill)    { fill.style.width = '0%'; fill.className = 'char-bar-fill'; }
                if (counter) { counter.textContent = `0 / ${MAX_CHARS}`; counter.className = 'char-count'; }

                startCooldownUI();
            } else {
                throw new Error(data.message || 'Respuesta inesperada del servidor.');
            }

        } catch (err) {
            console.error('[Confesionario] Error:', err);
            showFeedback('❌ Error al enviar: ' + err.message, 'error');
            if (btn) btn.disabled = false;
        } finally {
            setLoading(false);
        }
    });
}

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initCharCounter();
    initForm();
});
