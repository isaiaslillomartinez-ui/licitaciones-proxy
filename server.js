const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const TICKET = process.env.MP_TICKET || "59843159-7E49-473D-B60A-851DAC30A513";
const BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json";

// Palabras clave eléctricas para filtrar
const KEYWORDS_ELECTRICAS = [
  "eléctric","electric","alumbrado","luminaria","tablero","transformador",
  "cable","conductor","empalme","subestación","subestacion","bt","at ",
  "mantención eléc","instalación eléc","grupo electrógeno","electrogeno",
  "ups","interruptor","breaker","fusible","contactor","ducto","bandeja"
];

function esDeLicitacionElectrica(licitacion) {
  const texto = (
    (licitacion.Nombre || "") + " " +
    (licitacion.Descripcion || "") + " " +
    (licitacion.Tipo || "")
  ).toLowerCase();
  return KEYWORDS_ELECTRICAS.some(k => texto.includes(k.toLowerCase()));
}

function getFechaHoy() {
  const d = new Date();
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}${mes}${anio}`;
}

// GET /licitaciones?nombre=electricidad&estado=vigente&cantidad=10&inicio=0
app.get("/licitaciones", async (req, res) => {
  try {
    const busqueda = (req.query.nombre || "electricidad").toLowerCase();
    const cantidad = parseInt(req.query.cantidad) || 10;
    const inicio = parseInt(req.query.inicio) || 0;
    const fecha = getFechaHoy();

    // La API solo acepta fecha + estado
    const url = `${BASE_URL}?fecha=${fecha}&estado=publicada&ticket=${TICKET}`;
    console.log(`[${new Date().toISOString()}] Consultando fecha ${fecha} | busqueda: ${busqueda}`);

    const response = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" }
    });

    const text = await response.text();
    console.log(`Status: ${response.status} | Preview: ${text.substring(0, 200)}`);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Error API", status: response.status, detalle: text });
    }

    const data = JSON.parse(text);
    let listado = data.Listado || [];

    // Filtrar por palabras clave eléctricas + búsqueda del usuario
    const keywordsUsuario = busqueda.split(" ").filter(k => k.length > 2);
    listado = listado.filter(l => {
      const txt = ((l.Nombre || "") + " " + (l.Descripcion || "")).toLowerCase();
      const esElectrica = esDeLicitacionElectrica(l);
      const matchBusqueda = keywordsUsuario.some(k => txt.includes(k));
      return esElectrica || matchBusqueda;
    });

    // Paginación manual
    const total = listado.length;
    const pagina = listado.slice(inicio, inicio + cantidad);

    res.json({
      Cantidad: total,
      FechaCreacion: data.FechaCreacion,
      Version: data.Version,
      Listado: pagina
    });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/licitacion/:codigo", async (req, res) => {
  try {
    const url = `${BASE_URL}?codigo=${encodeURIComponent(req.params.codigo)}&ticket=${TICKET}`;
    const response = await fetch(url);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", version: "3.0.0", fecha: getFechaHoy(), timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🔌 Servidor activo en puerto ${PORT}`));
