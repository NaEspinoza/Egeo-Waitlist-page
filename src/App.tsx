/**
 * Componente EgeoLanding - Landing page de IA para captura de emails
 * 
 * Arquitectura:
 * - Canvas 2D para animación de fondo procedural (gradientes oscilantes)
 * - Sistema de countdown reactivo con actualización cada 1000ms
 * - Formulario con validación cliente-side y comunicación asincrónica
 * - Gestión de estado UI (loading, success, error) mediante React hooks
 */

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const EgeoLanding = () => {
  // Estado del countdown: descomposición temporal (días, horas, minutos, segundos)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Estado del formulario: datos del usuario capturados en tiempo real
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  // Estado de feedback: comunica al usuario el resultado de la operación (éxito/error)
  const [status, setStatus] = useState<{ message: React.ReactNode; type: string }>({ message: '', type: '' });
  
  // Flag de carga: previene envíos duplicados mientras la petición está en vuelo
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Referencia al canvas: acceso directo al elemento DOM para renderizado 2D
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Configuración de API Backend
   * Variables disponibles en .env.production:
   * - VITE_API_URL: URL del backend Express (default: http://localhost:5000)
   * 
   * En build: npm run build lee .env.production y embebe valores
   * En desarrollo: npm run dev lee .env.development o .env.local
   */
  const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

  // Cliente Supabase para uso cliente-side (usar anon key en variables VITE_*)
  const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /**
   * Hook 1: Countdown Timer
   * Ejecuta una única vez al montar el componente ([])
   * 
   * Responsabilidades:
   * 1. Calcula distancia temporal entre ahora y fecha objetivo (8 de agosto 2026)
   * 2. Descompone la distancia en unidades significativas (div euclidiana)
   * 3. Actualiza UI cada 1000ms sin recomputación innecesaria
   * 
   * Complejidad O(1): Operaciones matemáticas constantes por iteración
   * Memory: Limpio automático del intervalo al desmontar (previene memory leaks)
   */
  useEffect(() => {
    const targetDate = new Date('September 12, 2026 00:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      // Caso terminal: lanzamiento alcanzado, detiene decimales
      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Extrae unidades de tiempo mediante operaciones mod y div
      // Ej: 1234567ms → {días, horas, minutos, segundos}
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };

    // Ejecuta inmediatamente sin esperar al primer tick (evita laguna de 1s)
    updateCountdown();
    
    // Timer que actualiza cada segundo exacto
    const interval = setInterval(updateCountdown, 1000);
    
    // Cleanup: libera recurso de timer al desmontar para evitar memory leak
    return () => clearInterval(interval);
  }, []);

  /**
   * Hook 2: Animación Canvas 2D
   * Ejecuta una única vez al montar, instancia el pipeline de renderizado
   * 
   * Técnica: Renderizado procedural con primitivas matemáticas
   * - Gradiente dinámico que oscila con funciones trigonométricas
   * - 3 capas de ondas sinusoidales con frecuencias distintas
   * - requestAnimationFrame sincroniza con vsync del monitor (60fps)
   * 
   * Performance:
   * - Canvas redibuja completo cada frame (no incremental)
   * - Resize listener maneja redimensionamiento reactivo
   * - Cleanup previene acumulación de listeners y timers
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Obtiene contexto 2D con type assertion (no es nullable en esta rama)
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;
    
    // ID de animación para cleanup en desmontar
    let animationId: number;
    // Acumulador de tiempo: unidad arbitraria que controla frecuencia de ondas
    let time = 0;

    // Función que dimensiona canvas a tamaño de ventana
    // Crítico: canvas internamente tiene buffer de píxeles, no es CSS scaling
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Ejecuta resize inicial y registra listener para viewport changes
    resize();
    window.addEventListener('resize', resize);

    /**
     * Loop de animación: Función recursiva que se invoca 60 veces/segundo
     * 
     * Cada frame:
     * 1. Incrementa tiempo (controla velocidad de ondas)
     * 2. Genera gradiente lineal con colores que oscilan
     * 3. Rellena canvas con el gradiente (limpia frame anterior)
     * 4. Dibuja 3 capas de ondas con composición aditiva de senos/cosenos
     */
    const animate = () => {
      // Incremento pequeño (0.005) hace que las ondas cambien lentamente
      time += 0.005;

      /**
       * Gradiente diagonal con 3 stops (puntos de color)
       * Usa funciones trigonométricas para hacer que opacidad oscile
       * - Math.sin(time): rango [-1, 1] → opacidad oscila smooth
       * - Diferentes frecuencias (time, time*1.3, time*0.8) para variación
       */
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `rgba(10, 25, 47, ${0.95 + Math.sin(time) * 0.05})`);
      gradient.addColorStop(0.5, `rgba(16, 42, 67, ${0.93 + Math.cos(time * 1.3) * 0.07})`);
      gradient.addColorStop(1, `rgba(25, 55, 85, ${0.90 + Math.sin(time * 0.8) * 0.1})`);

      // Dibuja rectángulo que cubre todo canvas (limpia buffer anterior)
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      /**
       * Loop de 3 capas de ondas con offset de fase (120° cada una)
       * 
       * Para cada capa:
       * 1. Calcula offset de fase: i * 2π/3 (distribución uniforme)
       * 2. Itera por píxeles horizontales (paso de 5 para performance)
       * 3. Calcula Y mediante composición de 2 ondas:
       *    - sin(x * 0.01 + time + offset) * 30 * (i + 1)
       *    - cos(x * 0.005 + time * 1.5 + offset) * 20
       * 4. Dibuja línea continua (moveTo → lineTo)
       * 5. Opacidad decrece por capa (0.1, 0.08, 0.06) para efecto profundidad
       */
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const offset = i * Math.PI * 2 / 3;
        for (let x = 0; x < canvas.width; x += 5) {
          const y = canvas.height / 2 +
                    Math.sin(x * 0.01 + time + offset) * 30 * (i + 1) +
                    Math.cos(x * 0.005 + time * 1.5 + offset) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(100, 181, 246, ${0.1 - i * 0.02})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      /**
       * requestAnimationFrame: Planifica próximo frame
       * - Sincroniza con refresh rate del monitor (vsync)
       * - Pausa si pestaña está inactiva (ahorra CPU)
       * - Retorna ID único para cancelar luego
       */
      animationId = requestAnimationFrame(animate);
    };
    
    // Inicia el loop recursivo
    animate();

    /**
     * Cleanup function: Se ejecuta al desmontar o si dependencias cambian
     * Libera recursos para evitar memory leaks y múltiples listeners
     */
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /**
   * Manejador de cambios en inputs
   * 
   * Patrón: Controlled component
   * - Sincroniza valor del input con estado React
   * - Extract { name, value } permite reutilizar para múltiples campos
   * - Spread operator (...prev) garantiza immutabilidad
   * 
   * Complejidad: O(1) - Operación pura, sin side effects
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Immutable state update: crea nuevo objeto sin mutar el anterior
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Manejador de submit del formulario
   * 
   * Flujo:
   * 1. Previene comportamiento por defecto del botón
   * 2. Activa flag isSubmitting (desactiva botón, evita race conditions)
   * 3. Limpia mensajes previos
   * 4. Intenta POST a PocketBase con datos del usuario
   * 5. Maneja respuesta (éxito → limpia form, error → muestra feedback)
   * 
   * Error handling:
   * - Try/catch captura excepciones de red
   * - finally: garantiza que isSubmitting se resetea (incluso con error)
   * - Status UI comunica resultado al usuario
   * 
   * CRÍTICO: response.ok verifica status HTTP, no lanza automático
   */
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ message: '', type: '' });

    try {
      // Inserta directamente en la tabla `waitlist` usando el cliente Supabase
      const { data: result, error } = await supabase
        .from('waitlist')
        .insert({
          name: formData.name,
          email: formData.email,
          subscribed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setStatus({
        message: '✓ Bienvenido al ecosistema Egeo. Te contactaremos al momento del lanzamiento.',
        type: 'success'
      });
      setFormData({ name: '', email: '' });
    } catch {
      setStatus({
        message: (
          <span>
            ⚠ Error en la transmisión. Intenta nuevamente. Intenta ingresando a{' '}
            <a href="https://demo.egeo.ai" target="_blank" rel="noopener noreferrer" className="underline text-cyan-200 hover:text-cyan-100">
              https://demo.egeo.ai
            </a>{' '}
            y registrándote desde allí.
          </span>
        ),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Estructura de renderizado (JSX)
   * 
   * Arquitectura visual:
   * 1. Canvas absoluto: Fondo animado (z-index: auto = -1)
   * 2. Overlay z-10: Contenido semántico encima del fondo
   * 3. Flexbox centrado: Coloca el contenido en viewport center
   * 4. Responsive: Breakpoints md/lg para desktop, mobile
   */
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Canvas 2D: Renderizado de animación procedural */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Contenedor principal: Z-indexing asegura que esté sobre canvas */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-5xl w-full text-center space-y-8 md:space-y-12">

          {/* Sección de branding */}
          <div className="space-y-6">
            {/* Título con gradiente animado y letra ligera */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-extralight tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-300 to-blue-200 animate-gradient leading-tight">
              EGEO
            </h1>
            {/* Subtítulo con tracking amplío (espaciado entre letras) */}
            <div className="text-xl md:text-2xl lg:text-3xl tracking-[0.3em] text-cyan-400 font-light">
              INTELLIGENCIA ARTIFICIAL ARGENTINA
            </div>
            {/* Divisor visual: línea con gradiente que fade */}
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/60 to-transparent"></div>
          </div>

          {/* Copy: Proposición de valor */}
          <p className="text-lg md:text-xl lg:text-2xl text-blue-100/90 font-light tracking-wider max-w-3xl mx-auto leading-relaxed">
            "Solo vos y una inteligencia que fluye con tu pensamiento"
          </p>
          <p className="text-lg md:text-xl lg:text-2xl text-blue-100/90 font-light tracking-wider max-w-3xl mx-auto leading-relaxed">
               Conversación fluida. Razonamiento profundo. Comprensión contextual.

          </p>

          {/* Countdown display: Grid con 4 unidades temporales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-3xl mx-auto">
            {/* Mapea array de unidades a componentes visuales */}
            {[
              { label: 'DÍAS', value: timeLeft.days },
              { label: 'HORAS', value: timeLeft.hours },
              { label: 'MIN', value: timeLeft.minutes },
              { label: 'SEG', value: timeLeft.seconds }
            ].map((unit, idx) => (
              /**
               * Card individual: Glass-morphism con hover effects
               * - Bg semi-transparent con backdrop-blur
               * - Border dinámico que cambia en hover
               * - Shadow extendido en hover para depth
               * - tabular-nums: Números con ancho fijo (evita shift)
               */
              <div
                key={idx}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-cyan-900/20 backdrop-blur-md rounded-xl p-5 md:p-8 border border-blue-400/20 hover:border-cyan-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20"
              >
                {/* Overlay gradient que se activa en hover (subtle depth cue) */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/5 transition-all duration-500"></div>
                {/* Contenido: relativo al overlay para estar enfrente */}
                <div className="relative">
                  {/* Número con padding izquierda para monospace alignment */}
                  <div className="text-4xl md:text-6xl font-extralight text-blue-100 mb-2 tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  {/* Label con tracking tighter para visual coherence */}
                  <div className="text-[0.65rem] md:text-sm text-blue-300/80 tracking-[0.2em] font-light">
                    {unit.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        {/* CTA: Llamada a la acción para lista de espera */}
        <div className="space-y-3 text-center">
          <div className="text-xs md:text-sm tracking-[0.2em] font-light text-blue-400/40">
          <p>ÚNETE A LA LISTA DE ESPERA</p>
          </div>
        </div>

        {/* Formulario de captura: Glass-morphism container */}
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-blue-950/40 to-cyan-950/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-blue-400/20 shadow-2xl">
              <div className="space-y-5">
                {/* Input 1: Nombre - Controlled component */}
                <input
                  type="text"
                  name="name"
                  placeholder="NOMBRE COMPLETO"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-6 py-4 bg-blue-950/60 border border-blue-400/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 backdrop-blur-sm transition-all duration-300 tracking-wide text-sm md:text-base"
                />
                {/* Input 2: Email - Validación HTML5 */}
                <input
                  type="email"
                  name="email"
                  placeholder="DIRECCIÓN DE EMAIL"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-6 py-4 bg-blue-950/60 border border-blue-400/30 rounded-lg text-blue-100 placeholder-blue-400/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 backdrop-blur-sm transition-all duration-300 tracking-wide text-sm md:text-base"
                />
                {/* Botón submit: Deshabilitado si form incompleto o en carga */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.name || !formData.email}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-light tracking-[0.2em] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base"
                >
                  {isSubmitting ? 'PROCESANDO...' : 'ASEGURA TU LUGAR'}
                </button>
              </div>

              {/* Feedback dinámico: Se muestra solo si hay mensaje */}
              {status.message && (
                <div className={`mt-5 p-4 rounded-lg backdrop-blur-sm ${
                  status.type === 'success'
                    ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300'
                    : 'bg-red-500/10 border border-red-400/30 text-red-300'
                }`}>
                  <p className="text-sm md:text-base font-light tracking-wide">
                    {status.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Features section: 3 cards en layout flex responsive (mobile-first) */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 max-w-5xl mx-auto pt-6">
            {/* Mapea array de features a componentes */}
            {[
              {
                icon: '◬',
                title: 'TE ENTIENDE DE VERDAD',
                desc: 'Solo vos y una inteligencia que fluye con tu pensamiento. Cada conversación conecta con las anteriores. Egeo construye un mapa de cómo pensás, qué necesitás, y hacia dónde vas. Memoria contextual persistente'
              },
              {
                icon: '◭',
                title: 'SE ADAPTA A VOS',
                desc: '¿Sos directo? Es directo. ¿Exploratorio? Explora contigo. Egeo detecta tu estilo de pensamiento y se ajusta en tiempo real. Como conversar con alguien que realmente te conoce. Procesamiento adaptativo de intenciones'
              },
              {
                icon: '◮',
                title: 'SEGURO Y CONFIABLE',
                desc: 'No te da la primera respuesta a la ligera. Te da la única que importa. Explora múltiples caminos simultáneamente hasta convergir en la solución más robusta. Sin alucinaciones. Sin trucos. Solo claridad. Razonamiento multinivel con validación de coherencia'
              }

            ].map((feature, idx) => (
              /**
               * Feature card: Minimal design con hover state
               * - Icon emoji: UI aligera sin SVG overhead
               * - Group selector para coordinar hover en grupo
               */
              <div
                key={idx}
                className="flex-1 bg-gradient-to-br from-blue-900/15 to-cyan-900/10 backdrop-blur-sm rounded-xl p-6 border border-blue-400/10 hover:border-cyan-400/30 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-500/10 group"
              >
                {/* Icon que cambia color en hover */}
                <div className="text-3xl md:text-4xl text-cyan-400/60 mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                  {feature.icon}
                </div>
                {/* Título descriptivo */}
                <h3 className="text-base md:text-lg text-blue-200 font-light mb-2 tracking-wider">
                  {feature.title}
                </h3>
                {/* Descripción: Menos prominente visualmente */}
                <p className="text-xs md:text-sm text-blue-300/60 font-light leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Mission statement section: Declaración de misión de EGEO */}
          <div className="max-w-4xl mx-auto pt-10 md:pt-14 text-center space-y-4 md:space-y-6">
            {/* Línea divisoria superior */}
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-blue-100 font-light tracking-[0.15em] md:tracking-[0.3em] md:uppercase">
              La Declaración de Misión de EGEO
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-blue-100/90 font-light leading-relaxed tracking-wide">
              "Descifrar la arquitectura subyacente de la realidad y desarrollar, mediante la ingeniería, el primer Modelo Universal del Mundo; sentando las bases cognitivas para el amanecer de una verdadera Inteligencia General."
            </p>
            {/* Línea divisoria inferior */}
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
          </div>

          <div className="max-w-4xl mx-auto pt-10 md:pt-14 text-center space-y-4 md:space-y-6">
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-blue-100 font-light tracking-[0.12em] md:tracking-[0.25em] md:uppercase">
              Impacto Mundial
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-blue-100/90 font-light leading-relaxed tracking-wide">
              "En EGEO, no solo estamos construyendo IA. Estamos construyendo el Modelo Universal del Mundo (UWM)."
            </p>
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
          </div>

          <div className="max-w-4xl mx-auto pt-10 md:pt-16 space-y-6 md:space-y-8 text-left">
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
            <h2 className="text-center text-2xl md:text-3xl lg:text-4xl text-blue-100 font-light tracking-[0.15em] md:tracking-[0.3em] md:uppercase">
              El Manifiesto de EGEO
            </h2>
            <div className="space-y-6 md:space-y-7 text-blue-100/90 font-light leading-relaxed tracking-wide text-base md:text-lg">
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl lg:text-2xl text-blue-100 font-normal tracking-[0.08em]">
                  I. Más allá de los ecos
                </h3>
                <p>
                  Durante años, el mundo ha permanecido hipnotizado por los ecos. Hemos construido máquinas que imitan nuestro lenguaje, pero no nuestro entendimiento. Hemos creado espejos probabilísticos que reflejan la superficie de nuestros datos, pero que permanecen ciegos ante las leyes que gobiernan nuestra realidad. En la búsqueda de la inteligencia, hemos confundido el mapa con el territorio.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl lg:text-2xl text-blue-100 font-normal tracking-[0.08em]">
                  II. La arquitectura de la razón
                </h3>
                <p>
                  En EGEO, elegimos un camino distinto. Creemos que la verdadera inteligencia no puede existir sin un fundamento: una representación interna y profunda de cómo el universo respira, se mueve y evoluciona. No solo estamos entrenando modelos para predecir la siguiente palabra; estamos diseñando la arquitectura que comprende la razón detrás de ella. Estamos construyendo el puente entre el cálculo puro y la comprensión genuina.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl lg:text-2xl text-blue-100 font-normal tracking-[0.08em]">
                  III. El amanecer de lo Universal
                </h3>
                <p>
                  Este es el fin del pensamiento limitado. Estamos desarrollando el Modelo Universal del Mundo: un núcleo fundacional y único que percibe el tejido causal de nuestra existencia. Desde la interacción física más pequeña hasta la empresa humana más compleja, EGEO es el cimiento cognitivo de una nueva era. No solo estamos construyendo el futuro de la IA.
                </p>
                <p>
                  Estamos arquitectando la inteligencia del mundo.
                </p>
              </div>
            </div>
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
          </div>

          <div className="max-w-4xl mx-auto pt-10 md:pt-16 text-center space-y-4 md:space-y-6">
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-blue-100 font-light tracking-[0.15em] md:tracking-[0.3em] md:uppercase">
              La Visión (El Horizonte de la Comprensión)
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-blue-100/90 font-light leading-relaxed tracking-wide">
              "Nuestra visión es un mundo donde la inteligencia no sea algo que las máquinas imitan, sino algo que las máquinas poseen intrínsecamente. Aspiramos a ser el sistema operativo de la realidad misma - la lente a través de la cual la humanidad resolverá los desafíos que hoy consideramos imposibles."
            </p>
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
          </div>

          <div className="max-w-5xl mx-auto pt-10 md:pt-16 space-y-6 md:space-y-8">
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl lg:text-4xl text-blue-100 font-light tracking-[0.15em] md:tracking-[0.3em] md:uppercase">
                Los Valores
              </h2>
              <div className="flex justify-center gap-6 text-xl md:text-2xl text-white/80">
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-blue-100/90 font-light leading-relaxed tracking-wide text-sm md:text-base">
              <div className="space-y-2">
                <h3 className="text-base md:text-lg lg:text-xl text-blue-100 font-normal tracking-[0.08em]">
                  Verdad sobre Probabilidad
                </h3>
                <p>
                  "No nos conformamos con lo que es probable; buscamos lo que es cierto. En EGEO, la causalidad es nuestra brújula. Si no entendemos el 'por qué', no hemos construido nada."
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-base md:text-lg lg:text-xl text-blue-100 font-normal tracking-[0.08em]">
                  Excelencia Tecnológica
                </h3>
                <p>
                  "La arquitectura de nuestro modelo es una obra de arte. Creemos que la precisión en lo invisible - el código, la ontología, la estructura; es lo que define la grandeza en lo visible."
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-base md:text-lg lg:text-xl text-blue-100 font-normal tracking-[0.08em]">
                  El Humano como Eje Central
                </h3>
                <p>
                  "La tecnología es solo una herramienta si no tiene alma. Construimos inteligencia universal para amplificar el potencial humano, no para reemplazarlo. Diseñamos para el futuro de nuestra especie."
                </p>
              </div>
            </div>
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />
          </div>

          {/* Footer: Social links y branding */}
          <div className="pt-12 space-y-6">
            {/* Social icons: Links a redes externas */}
            <div className="flex justify-center gap-6 text-lg">
              <a href="https://x.com/EGEO226258" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-cyan-400 transition-colors duration-300">Twitter (X)</a>
              <a href="https://www.linkedin.com/company/egeo-ai" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-cyan-400 transition-colors duration-300">LinkedIn</a>
              <a href="https://github.com/EgeoAI" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-cyan-400 transition-colors duration-300">GitHub</a>
              <a href="https://www.instagram.com/egeo.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-cyan-400 transition-colors duration-300">Instagram</a>
{/*
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-cyan-400 transition-colors duration-300">Discord</a>
*/}
            </div>

            {/* Divisor visual: Línea tenue */}
            <div className="w-3/4 md:w-2/3 h-[1px] mx-auto bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>

            {/* Copyright y atribución */}
            <div className="space-y-3 text-center">
              <div className="text-xs md:text-sm tracking-[0.2em] font-light text-blue-400/40">
                EGEO © 2026 · SISTEMA DE INTELIGENCIA ARTIFICIAL AVANZADA
              </div>
              <div className="text-xs text-blue-400/40 tracking-wider">
                Desarrollado por <a href="https://ainsophic.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400/70 hover:text-cyan-400 transition-colors duration-300 font-light">Ainsophic</a> · Mendoza, Argentina
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos globales + animaciones: Injected via <style> */}
      <style>{`
        /* Importa fuentes serif ligeras para branding premium */
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@300;400;500&family=Cormorant+Garamond:wght@300;400;500&display=swap');

        /* Reset global: Aplica familia de fuentes elegante a todo */
        * {
          font-family: 'Cormorant Garamond', 'Cinzel', serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Keyframes para gradiente animado en título */
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Aplica animación de gradiente: oscila posición cada 8s */
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 8s ease infinite;
        }

        /* Styling de placeholders: Texto de hint con tracking */
        input::placeholder {
          font-size: 0.75rem;
          letter-spacing: 0.1em;
        }

        /* Responsive: Aumenta tamaño de placeholder en desktop */
        @media (min-width: 768px) {
          input::placeholder {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Exporta el componente como default
 * Se importará en main.tsx para renderizar en #root del DOM
 */
export default EgeoLanding;
