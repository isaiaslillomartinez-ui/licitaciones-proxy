const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const TICKET = process.env.MP_TICKET || "5B8F0534-DFDA-4B62-BC15-6B6D55E8A6A3";
const BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json";

app.use(cors());
app.use(express.json());

// Servir la app web (Opción B)
app.use(express.static(path.join(__dirname, "public")));

// GET /licitaciones?nombre=electricidad&estado=vigente&cantidad=10&inicio=0
app.get("/licitaciones", async (req, res) => {
  try {
    const { nombre = "electricidad", estado = "vigente", cantidad = 10, inicio = 0 } = req.query;
    const url = `${BASE_URL}?nombre=${encodeURIComponent(nombre)}&estado=${estado}&cantidad=${cantidad}&inicio=${inicio}&ticket=${TICKET}`;
    console.log(`[${new Date().toISOString()}] ${nombre} | inicio:${inicio}`);
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) return res.status(response.status).json({ error: "Error API Mercado Público", status: response.status });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error proxy:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /licitacion/:codigo
app.get("/licitacion/:codigo", async (req, res) => {
  try {
    const url = `${BASE_URL}?codigo=${encodeURIComponent(req.params.codigo)}&ticket=${TICKET}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/status", (req, res) => {
  res.json({ status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
