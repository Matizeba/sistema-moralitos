import React, { useState, useEffect } from 'react';
import { Package, Search, Printer, User, CreditCard, CheckCircle, Truck, Lock, ArrowRight, LogOut, ChevronLeft, ChevronRight, MapPin, Clock, Phone, ShieldCheck, DollarSign, FileText } from 'lucide-react';

const API_URL = 'http://localhost:8080/api';

const CIUDADES = {
  1: 'Cochabamba',
  2: 'Santa Cruz',
  3: 'La Paz',
  4: 'El Alto',
  5: 'Sucre',
  6: 'Oruro',
  7: 'Potosí',
  8: 'Tarija',
  9: 'Beni',
  10: 'Pando'
};

const CIUDADES_MAP = {
  'Cochabamba': 1,
  'Santa Cruz': 2,
  'La Paz': 3,
  'El Alto': 4,
  'Sucre': 5,
  'Oruro': 6,
  'Potosí': 7,
  'Tarija': 8,
  'Beni': 9,
  'Pando': 10
};

export default function App() {
  const [vista, setVista] = useState('publico');
  const [autenticado, setAutenticado] = useState(false);

  // Rastreo Público
  const [guiaBuscar, setGuiaBuscar] = useState('');
  const [resultadoRastreo, setResultadoRastreo] = useState(null);
  const [errorRastreo, setErrorRastreo] = useState('');
  const [cargandoRastreo, setCargandoRastreo] = useState(false);

  // Login
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // POS
  const [activeTab, setActiveTab] = useState('nueva');
  const [encomiendas, setEncomiendas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 6;

  // Manifiesto Carga
  const [sucursalViaje, setSucursalViaje] = useState('Santa Cruz');

  // Campos Formulario POS
  const [remCi, setRemCi] = useState('');
  const [remNombre, setRemNombre] = useState('');
  const [remCel, setRemCel] = useState('');

  const [destCi, setDestCi] = useState('');
  const [destNombre, setDestNombre] = useState('');
  const [destCel, setDestCel] = useState('');

  const [origen, setOrigen] = useState('Cochabamba');
  const [destino, setDestino] = useState('Santa Cruz');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipoPago, setTipoPago] = useState('PAGADO');
  const [guiaTemp, setGuiaTemp] = useState('TM-TEMP');

  useEffect(() => {
    if (autenticado) cargarEncomiendas();
  }, [autenticado]);

  const cargarEncomiendas = async () => {
    try {
      const res = await fetch(`${API_URL}/encomiendas`);
      if (res.ok) {
        const data = await res.json();
        setEncomiendas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar encomiendas", error);
    }
  };

  const buscarCliente = async (ci, tipo) => {
    if (!ci.trim()) return;
    try {
      const res = await fetch(`${API_URL}/clientes/buscar/${ci.trim()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (tipo === 'rem') {
            setRemNombre(json.data.nombre_completo || '');
            setRemCel(json.data.celular || '');
          } else {
            setDestNombre(json.data.nombre_completo || '');
            setDestCel(json.data.celular || '');
          }
        }
      }
    } catch (e) {}
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const res = await fetch(`${API_URL}/encomiendas/actualizarEstado/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        setMensaje(`¡Guía #${id} actualizada a "${nuevoEstado}"!`);
        cargarEncomiendas();
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (e) {
      console.error("Error al actualizar estado", e);
    }
  };

  const reimprimirTicket = (enc) => {
    setRemNombre(enc.remitente_nombre || '---');
    setRemCi(enc.remitente_ci || '---');
    setRemCel('');

    setDestNombre(enc.destinatario_nombre || '---');
    setDestCi(enc.destinatario_ci || '---');
    setDestCel('');

    setOrigen(CIUDADES[enc.origen_id] || 'Cochabamba');
    setDestino(CIUDADES[enc.destino_id] || 'Santa Cruz');
    setDescripcion(enc.descripcion || '');
    setPrecio(enc.precio || '0');
    setTipoPago(enc.tipo_pago || 'PAGADO');
    setGuiaTemp(enc.codigo_rastreo || `TM-${enc.id}`);

    setActiveTab('nueva');
    setMensaje(`Reimprimiendo Recibo de la Guía ${enc.codigo_rastreo || enc.id}...`);
    setTimeout(() => { window.print(); }, 400);
  };

  // ENVIAR WHATSAPP DIRECTO AL NÚMERO DEL DESTINATARIO
  const enviarWhatsApp = (enc) => {
      const celRaw = enc.destinatario_celular || enc.remitente_celular || '';
      const numLimpio = String(celRaw).replace(/[^0-9]/g, '');

      if (!numLimpio) {
        alert("La encomienda no tiene un número de celular registrado en la base de datos.");
        return;
      }

      const numCompleto = numLimpio.length === 8 ? `591${numLimpio}` : numLimpio;

      const codigo = enc.codigo_rastreo || `TM-${enc.id}`;
      const origenNombre = CIUDADES[enc.origen_id] || 'Cochabamba';
      const destinoNombre = CIUDADES[enc.destino_id] || 'Santa Cruz';

      // Link de tu plataforma (aquí pondrás tu dominio web cuando subas a producción)
      const linkPlataforma = "http://localhost:5173";

      const mensajeWA = `¡Hola *${enc.destinatario_nombre || 'Cliente'}*! 👋

  Tienes una encomienda enviada por *${enc.remitente_nombre || 'Remitente'}* mediante *Transportadora Moralitos*. 🚚📦

  📌 *Nro. Guía:* ${codigo}
  📍 *Ruta:* ${origenNombre} ➔ ${destinoNombre}
  📦 *Detalle:* ${enc.descripcion || 'Paquete'}
  💰 *Modalidad:* ${enc.tipo_pago || 'PAGADO'} (Bs. ${enc.precio})

  🔍 *Rastrea tu envío en tiempo real aquí:*
  ${linkPlataforma}

  ¡Gracias por confiar en nosotros!`;

      const urlWA = `https://web.whatsapp.com/send?phone=${numCompleto}&text=${encodeURIComponent(mensajeWA)}`;

      window.open(urlWA, '_blank');
    };

  const handleRastrearPublico = async (e) => {
    e.preventDefault();
    if (!guiaBuscar.trim()) return;
    setCargandoRastreo(true);
    setErrorRastreo('');
    setResultadoRastreo(null);

    try {
      const res = await fetch(`${API_URL}/encomiendas/rastrear/${guiaBuscar.trim()}`);
      if (res.ok) {
        const json = await res.json();
        setResultadoRastreo(json.data);
      } else {
        setErrorRastreo('No se encontró ninguna encomienda registrada con esa guía.');
      }
    } catch (err) {
      setErrorRastreo('Error de conexión con el servidor.');
    } finally {
      setCargandoRastreo(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (usuario === 'admin' && password === 'moralitos123') {
      setAutenticado(true);
      setVista('pos');
      setErrorLogin('');
    } else {
      setErrorLogin('Usuario o contraseña incorrectos');
    }
  };

  const handleSubmitPOS = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');

    try {
      const resRem = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ci_nit: remCi, nombre_completo: remNombre, celular: remCel })
      });
      const dataRem = await resRem.json();
      const remId = dataRem.data?.id || dataRem.id;

      const resDest = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ci_nit: destCi, nombre_completo: destNombre, celular: destCel })
      });
      const dataDest = await resDest.json();
      const destId = dataDest.data?.id || dataDest.id;

      const payload = {
        remitente_id: parseInt(remId),
        destinatario_id: parseInt(destId),
        origen_id: CIUDADES_MAP[origen] || 1,
        destino_id: CIUDADES_MAP[destino] || 2,
        descripcion,
        precio: parseFloat(precio) || 0,
        tipo_pago: tipoPago
      };

      const resEnc = await fetch(`${API_URL}/encomiendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resEnc.ok) throw new Error('Error al registrar la encomienda');

      const dataEnc = await resEnc.json();
      const codigoGenerado = dataEnc.data?.codigo_rastreo || `TM-${dataEnc.data?.id || 'NUEVA'}`;
      setGuiaTemp(codigoGenerado);

      setMensaje(`¡Encomienda registrada con éxito! Código: ${codigoGenerado}`);
      cargarEncomiendas();

      setTimeout(() => { window.print(); }, 300);

    } catch (error) {
      setMensaje(error.message);
    } finally {
      setLoading(false);
    }
  };

  const encomiendasFiltradas = encomiendas.filter(e => {
    const q = filtro.toLowerCase();
    return (
      e.id.toString().includes(q) ||
      (e.codigo_rastreo && e.codigo_rastreo.toLowerCase().includes(q)) ||
      (e.remitente_nombre && e.remitente_nombre.toLowerCase().includes(q)) ||
      (e.destinatario_nombre && e.destinatario_nombre.toLowerCase().includes(q)) ||
      (e.descripcion && e.descripcion.toLowerCase().includes(q))
    );
  });

  const totalPaginas = Math.ceil(encomiendasFiltradas.length / itemsPorPagina) || 1;
  const encomiendasPaginadas = encomiendasFiltradas.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  const totalRecaudado = encomiendas.reduce((acc, item) => acc + (parseFloat(item.precio) || 0), 0);
  const totalPagado = encomiendas.filter(e => e.tipo_pago !== 'POR PAGAR').reduce((acc, item) => acc + (parseFloat(item.precio) || 0), 0);
  const totalPorPagar = encomiendas.filter(e => e.tipo_pago === 'POR PAGAR').reduce((acc, item) => acc + (parseFloat(item.precio) || 0), 0);

  const encomiendasViaje = encomiendas.filter(e => (CIUDADES[e.destino_id] || '') === sucursalViaje);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans w-full">
      
      {vista === 'publico' && (
        <div className="w-full">
          <header className="bg-[#1b7a3a] text-white px-8 py-4 flex items-center justify-between shadow-lg border-b-4 border-[#f25c05] w-full">
            <div className="flex items-center space-x-3">
              <div className="bg-[#f25c05] p-2 rounded-xl text-amber-300 shadow-md">
                <Truck size={32} className="stroke-[2.5]" />
              </div>
              <div className="leading-none">
                <span className="bg-[#0f4f24] px-2 py-0.5 rounded text-[10px] font-black tracking-widest text-emerald-200 uppercase inline-block mb-1">
                  TRANSPORTADORA
                </span>
                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-[#f25c05] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  MORALITOS
                </h1>
              </div>
            </div>

            <button
              onClick={() => setVista(autenticado ? 'pos' : 'login')}
              className="bg-[#f25c05] hover:bg-[#d94f00] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Lock size={15} /> {autenticado ? 'Ir al Panel POS' : 'Acceso Trabajadores'}
            </button>
          </header>

          <div className="bg-gradient-to-r from-[#13592a] via-[#1b7a3a] to-[#13592a] text-white py-16 px-6 text-center shadow-inner w-full relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">
              <div className="inline-flex items-center gap-2 bg-[#0f4f24] px-4 py-1.5 rounded-full text-xs font-extrabold text-amber-300 mb-4 border border-emerald-500/40">
                <ShieldCheck size={16} /> Envíos Nacionales Seguros y Confiables
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight text-white drop-shadow-md">
                Tus envíos llegan <span className="text-amber-300">Rápido y Seguro</span>
              </h1>
              <p className="text-emerald-100 text-sm md:text-base max-w-xl mx-auto mb-8 font-medium">
                Rastrea el estado de tu encomienda en tiempo real ingresando tu código de guía.
              </p>

              <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-2xl">
                <form onSubmit={handleRastrearPublico} className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Ingresa tu Nro. de Guía (Ej. TM-4932 o 7)"
                      value={guiaBuscar}
                      onChange={(e) => setGuiaBuscar(e.target.value)}
                      className="w-full bg-white text-slate-900 font-mono font-bold px-5 py-3.5 rounded-xl border-none focus:outline-none focus:ring-4 focus:ring-[#f25c05] text-base shadow-sm text-center md:text-left"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cargandoRastreo}
                    className="bg-[#f25c05] hover:bg-[#d94f00] text-white font-black px-8 py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-base cursor-pointer"
                  >
                    <Search size={20} /> {cargandoRastreo ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto p-6 space-y-8">
            {errorRastreo && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center font-semibold shadow-sm">
                {errorRastreo}
              </div>
            )}

            {resultadoRastreo ? (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Código de Guía</span>
                    <h3 className="text-3xl font-black text-[#f25c05] font-mono">
                      {resultadoRastreo.codigo_rastreo || `#TM-${resultadoRastreo.id}`}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Modalidad</span>
                    <p className={`text-xs font-bold px-3 py-1 rounded-full ${
                      resultadoRastreo.tipo_pago === 'POR PAGAR' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {resultadoRastreo.tipo_pago || 'PAGADO'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Estado Actual del Envío</p>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold">
                    <div className={`p-4 rounded-2xl border ${
                      ['RECIBIDO', 'Recibido', 'EN TRÁNSITO', 'En Tránsito', 'ENTREGADO', 'Entregado'].includes(resultadoRastreo.estado)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 text-slate-400'
                    }`}>
                      1. RECIBIDO
                    </div>
                    <div className={`p-4 rounded-2xl border ${
                      ['EN TRÁNSITO', 'En Tránsito', 'ENTREGADO', 'Entregado'].includes(resultadoRastreo.estado)
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-slate-50 text-slate-400'
                    }`}>
                      2. EN TRÁNSITO 🚚
                    </div>
                    <div className={`p-4 rounded-2xl border ${
                      ['ENTREGADO', 'Entregado'].includes(resultadoRastreo.estado)
                        ? 'bg-[#1b7a3a] text-white border-[#1b7a3a]'
                        : 'bg-slate-50 text-slate-400'
                    }`}>
                      3. ENTREGADO ✅
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase mb-1">Ruta del Envío:</p>
                    <p className="font-extrabold text-slate-800 text-base">
                      {CIUDADES[resultadoRastreo.origen_id] || 'Cochabamba'} ➔ {CIUDADES[resultadoRastreo.destino_id] || 'Santa Cruz'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase mb-1">Destinatario:</p>
                    <p className="font-extrabold text-slate-800 text-base">{resultadoRastreo.destinatario_nombre || '---'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center text-[#1b7a3a] mb-3">
                    <MapPin size={20} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">Cobertura Nacional</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Oficinas en **La Paz, El Alto, Sucre, Cochabamba, Santa Cruz, Oruro, Potosí, Tarija, Beni y Pando**.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="bg-amber-100 w-10 h-10 rounded-xl flex items-center justify-center text-[#f25c05] mb-3">
                    <Clock size={20} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">Atención Continua</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Recepciones y entregas de encomiendas de Lunes a Sábado.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center text-[#1b7a3a] mb-3">
                    <Phone size={20} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">Soporte Directo</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Avisos automáticos por WhatsApp y consultas rápidas por la plataforma.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {vista === 'login' && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#1b7a3a] w-full">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-6 border-t-8 border-[#f25c05]">
            <div className="text-center space-y-1">
              <div className="bg-[#f25c05] w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-white font-bold shadow-md mb-2">
                <Lock size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Acceso Operadores</h2>
              <p className="text-xs font-bold text-[#1b7a3a] uppercase tracking-wider">TRANSPORTADORA MORALITOS</p>
            </div>

            {errorLogin && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold text-center">
                {errorLogin}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b7a3a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="moralitos123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b7a3a]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1b7a3a] hover:bg-[#13592a] text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Ingresar al Sistema <ArrowRight size={16} />
              </button>
            </form>

            <button
              onClick={() => setVista('publico')}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              ← Volver a la página principal
            </button>
          </div>
        </div>
      )}

      {vista === 'pos' && (
        <div className="w-full">
          <header className="bg-[#1b7a3a] text-white px-8 py-4 flex items-center justify-between shadow-md border-b-4 border-[#f25c05] w-full">
            <div className="flex items-center space-x-3">
              <div className="bg-[#f25c05] p-2 rounded-xl text-white font-bold shadow-sm">
                <Truck size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black italic tracking-tighter text-white">
                  TRANSPORTADORA <span className="text-[#f25c05]">MORALITOS</span>
                </h1>
                <p className="text-xs text-emerald-200">Sistema POS Trabajadores</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-[#0f4f24] p-1 rounded-xl border border-emerald-600/50">
                <button
                  onClick={() => setActiveTab('nueva')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'nueva' ? 'bg-[#f25c05] text-white shadow-md' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  Nueva Encomienda
                </button>
                <button
                  onClick={() => setActiveTab('lista')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'lista' ? 'bg-[#f25c05] text-white shadow-md' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  Lista y Rastreo
                </button>
                <button
                  onClick={() => setActiveTab('finanzas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'finanzas' ? 'bg-[#f25c05] text-white shadow-md' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  Caja / Finanzas
                </button>
                <button
                  onClick={() => setActiveTab('viajes')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'viajes' ? 'bg-[#f25c05] text-white shadow-md' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  Manifiesto Carga
                </button>
              </div>

              <button
                onClick={() => { setAutenticado(false); setVista('publico'); }}
                title="Cerrar Sesión"
                className="bg-red-500/20 hover:bg-red-500 text-red-100 hover:text-white p-2.5 rounded-xl transition cursor-pointer border border-red-500/30"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main className="p-6 max-w-7xl mx-auto">
            {mensaje && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-800 font-semibold text-center shadow-sm">
                {mensaje}
              </div>
            )}

            {activeTab === 'nueva' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form onSubmit={handleSubmitPOS} className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-[#1b7a3a] uppercase tracking-wider">
                      <User size={18} /> 1. Remitente (Quien Envía)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CI / NIT *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={remCi}
                            onChange={(e) => setRemCi(e.target.value)}
                            onBlur={() => buscarCliente(remCi, 'rem')}
                            placeholder="Escribe y presiona TAB"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                          />
                          <Search size={16} className="absolute right-3 top-2.5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={remNombre}
                          onChange={(e) => setRemNombre(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Celular</label>
                        <input
                          type="text"
                          value={remCel}
                          onChange={(e) => setRemCel(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-[#1b7a3a] uppercase tracking-wider">
                      <User size={18} /> 2. Destinatario (Quien Recibe)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CI / NIT *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={destCi}
                            onChange={(e) => setDestCi(e.target.value)}
                            onBlur={() => buscarCliente(destCi, 'dest')}
                            placeholder="Escribe y presiona TAB"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                          />
                          <Search size={16} className="absolute right-3 top-2.5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={destNombre}
                          onChange={(e) => setDestNombre(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Celular *</label>
                        <input
                          type="text"
                          required
                          value={destCel}
                          onChange={(e) => setDestCel(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2 text-[#1b7a3a] uppercase tracking-wider">
                      <Package size={18} /> 3. Detalle del Paquete
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Origen *</label>
                        <select
                          value={origen}
                          onChange={(e) => setOrigen(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition font-semibold"
                        >
                          {Object.values(CIUDADES).map((ciudad) => (
                            <option key={ciudad} value={ciudad}>{ciudad}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Destino *</label>
                        <select
                          value={destino}
                          onChange={(e) => setDestino(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition font-semibold"
                        >
                          {Object.values(CIUDADES).map((ciudad) => (
                            <option key={ciudad} value={ciudad}>{ciudad}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>
                        <input
                          type="text"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          placeholder="Ej. Caja, bolsa..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Precio (Bs.) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={precio}
                          onChange={(e) => setPrecio(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1b7a3a] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={15} className="text-[#1b7a3a]" /> Forma de Pago *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setTipoPago('PAGADO')}
                          className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                            tipoPago === 'PAGADO' ? 'bg-[#1b7a3a] text-white border-[#1b7a3a] shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${tipoPago === 'PAGADO' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                          PAGADO
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoPago('POR PAGAR')}
                          className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                            tipoPago === 'POR PAGAR' ? 'bg-[#f25c05] text-white border-[#f25c05] shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${tipoPago === 'POR PAGAR' ? 'bg-white' : 'bg-amber-500'}`}></span>
                          POR PAGAR
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1b7a3a] hover:bg-[#13592a] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-base cursor-pointer"
                  >
                    <Printer size={20} /> {loading ? 'Guardando...' : 'Guardar e Imprimir Recibo Térmico'}
                  </button>
                </form>

                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket POS (80mm)</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded font-bold">GUIA #{guiaTemp}</span>
                  </div>

                  <div id="ticket-pos" className="bg-[#fefcf6] text-slate-900 p-5 rounded-2xl font-mono text-xs border border-amber-200/70 shadow-sm space-y-3">
                    <div className="text-center pb-2 border-b border-dashed border-slate-300">
                      <p className="font-extrabold text-sm tracking-tight">TRANSPORTADORA MORALITOS</p>
                      <p className="text-[10px] text-slate-500">Servicio de Encomiendas</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date().toLocaleString()}</p>
                    </div>

                    <div className={`text-center py-1.5 px-2 rounded font-extrabold text-xs uppercase tracking-wider border ${
                      tipoPago === 'POR PAGAR' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      [ {tipoPago} ]
                    </div>

                    <div className="text-center py-1.5 bg-slate-100 rounded-lg font-bold text-slate-800 border border-slate-200/60">
                      {origen.toUpperCase()} &nbsp;➔&nbsp; {destino.toUpperCase()}
                    </div>

                    <div className="space-y-0.5 text-[11px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Remitente:</p>
                      <p className="font-bold text-slate-800">{remNombre || '---'}</p>
                      <p className="text-[10px] text-slate-500">CI: {remCi || '---'} {remCel && `| Cel: ${remCel}`}</p>
                    </div>

                    <div className="space-y-0.5 text-[11px] pt-2 border-t border-dashed border-slate-300">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Destinatario:</p>
                      <p className="font-bold text-[#1b7a3a]">{destNombre || '---'}</p>
                      <p className="text-[10px] text-slate-500">CI: {destCi || '---'} {destCel && `| Cel: ${destCel}`}</p>
                    </div>

                    <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase">Detalle:</span>
                      <span className="text-slate-900">{descripcion || '---'}</span>
                    </div>

                    <div className="flex justify-between items-center font-extrabold text-sm pt-1 text-slate-900">
                      <span>TOTAL MONTO:</span>
                      <span className="text-base text-slate-950">Bs. {precio ? parseFloat(precio).toFixed(2) : '0.00'}</span>
                    </div>

                    <div className="pt-2">
                      <div className="bg-slate-900 text-white text-center py-2 rounded text-[10px] tracking-widest font-bold">
                        ||||| |||||| ||| |||| ||||
                      </div>
                    </div>

                    <div className="text-center pt-2 text-[10px] text-slate-400 italic">
                      ¡Gracias por su preferencia!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lista' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-800">Lista y Rastreo de Encomiendas</h2>
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Buscar por #Guía, código, cliente..."
                      value={filtro}
                      onChange={(e) => { setFiltro(e.target.value); setPaginaActual(1); }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b7a3a]"
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-emerald-50 text-xs uppercase text-emerald-900 border-b border-emerald-200">
                      <tr>
                        <th className="px-4 py-3">Guía / Código</th>
                        <th className="px-4 py-3">Ruta</th>
                        <th className="px-4 py-3">Remitente / Destinatario</th>
                        <th className="px-4 py-3">Descripción</th>
                        <th className="px-4 py-3">Monto</th>
                        <th className="px-4 py-3">Pago</th>
                        <th className="px-4 py-3">Estado actual</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {encomiendasPaginadas.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-6 text-center text-slate-400">
                            No se encontraron encomiendas.
                          </td>
                        </tr>
                      ) : (
                        encomiendasPaginadas.map((enc) => (
                          <tr key={enc.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="px-4 py-3 font-mono font-bold text-[#f25c05]">
                              {enc.codigo_rastreo || `#${enc.id}`}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {CIUDADES[enc.origen_id] || 'Cochabamba'} ➔ {CIUDADES[enc.destino_id] || 'Santa Cruz'}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <p><span className="font-bold text-slate-700">De:</span> {enc.remitente_nombre || '---'}</p>
                              <p><span className="font-bold text-[#1b7a3a]">Para:</span> {enc.destinatario_nombre || '---'}</p>
                            </td>
                            <td className="px-4 py-3">{enc.descripcion}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">Bs. {enc.precio}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                enc.tipo_pago === 'POR PAGAR' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {enc.tipo_pago || 'PAGADO'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                                ['ENTREGADO', 'Entregado'].includes(enc.estado) ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : ['EN TRÁNSITO', 'En Tránsito'].includes(enc.estado) ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {enc.estado || 'Recibido'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-1.5">
                                <button
                                  title="Reimprimir Ticket POS"
                                  onClick={() => reimprimirTicket(enc)}
                                  className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition border border-slate-300 cursor-pointer"
                                >
                                  <Printer size={15} />
                                </button>
                                <button
                                  title="Enviar Notificación por WhatsApp"
                                  onClick={() => enviarWhatsApp(enc)}
                                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow-sm cursor-pointer"
                                >
                                  <Phone size={15} />
                                </button>
                                <button
                                  title="Marcar En Tránsito"
                                  onClick={() => cambiarEstado(enc.id, 'En Tránsito')}
                                  className="p-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition border border-amber-200 cursor-pointer"
                                >
                                  <Truck size={15} />
                                </button>
                                <button
                                  title="Marcar Entregado"
                                  onClick={() => cambiarEstado(enc.id, 'Entregado')}
                                  className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition border border-emerald-200 cursor-pointer"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-sm text-slate-600">
                  <div>Mostrando {encomiendasPaginadas.length} de {encomiendasFiltradas.length} encomiendas</div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={paginaActual === 1}
                      onClick={() => setPaginaActual(prev => prev - 1)}
                      className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-semibold text-slate-800">Página {paginaActual} de {totalPaginas}</span>
                    <button
                      disabled={paginaActual === totalPaginas}
                      onClick={() => setPaginaActual(prev => prev + 1)}
                      className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'finanzas' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign className="text-[#1b7a3a]" /> Reporte de Caja y Finanzas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">Recaudación Total</p>
                    <h3 className="text-3xl font-black text-[#1b7a3a]">Bs. {totalRecaudado.toFixed(2)}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">Total Pagado</p>
                    <h3 className="text-3xl font-black text-emerald-600">Bs. {totalPagado.toFixed(2)}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">Total Por Cobrar (Por Pagar)</p>
                    <h3 className="text-3xl font-black text-[#f25c05]">Bs. {totalPorPagar.toFixed(2)}</h3>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'viajes' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <FileText className="text-[#1b7a3a]" /> Manifiesto de Carga por Destino
                  </h2>
                  <select
                    value={sucursalViaje}
                    onChange={(e) => setSucursalViaje(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold text-slate-800"
                  >
                    {Object.values(CIUDADES).map(c => (
                      <option key={c} value={c}>Destino: {c}</option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-emerald-50 text-xs uppercase text-emerald-900 border-b border-emerald-200">
                      <tr>
                        <th className="px-4 py-3">Guía</th>
                        <th className="px-4 py-3">Remitente</th>
                        <th className="px-4 py-3">Destinatario</th>
                        <th className="px-4 py-3">Descripción</th>
                        <th className="px-4 py-3">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {encomiendasViaje.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-400">
                            No hay encomiendas registradas hacia {sucursalViaje}.
                          </td>
                        </tr>
                      ) : (
                        encomiendasViaje.map(enc => (
                          <tr key={enc.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-[#f25c05]">{enc.codigo_rastreo}</td>
                            <td className="px-4 py-3">{enc.remitente_nombre || '---'}</td>
                            <td className="px-4 py-3 font-semibold">{enc.destinatario_nombre || '---'}</td>
                            <td className="px-4 py-3">{enc.descripcion}</td>
                            <td className="px-4 py-3 font-bold">Bs. {enc.precio}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-[#1b7a3a] hover:bg-[#13592a] text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer size={18} /> Imprimir Hoja de Ruta para Chofer
                </button>
              </div>
            )}
          </main>
        </div>
      )}

    </div>
  );
}