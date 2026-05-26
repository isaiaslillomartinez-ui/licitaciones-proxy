const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const TICKET = process.env.MP_TICKET || "59843159-7E49-473D-B60A-851DAC30A513";
const BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/licitaciones", async (req, res) => {
  try {
    const nombre = req.query.nombre || "electricidad";
    const estado = req.query.estado || "vigente";
    const cantidad = req.query.cantidad || 10;
    const inicio = req.query.inicio || 0;

    const url = `${BASE_URL}?nombre=${encodeURIComponent(nombre)}&estado=${estado}&cantidad=${cantidad}&inicio=${inicio}&ticket=${TICKET}`;
    console.log(`[${new Date().toISOString()}] Consultando: ${nombre} | inicio:${inicio}`);

    const response = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" }
    });

    const text = await response.text();
    console.log(`Status: ${response.status} | Body: ${text.substring(0,300)}`);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Error API", status: response.status, detalle: text });
    }

    res.json(JSON.parse(text));

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

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", version: "2.2.0", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🔌 Servidor activo en puerto ${PORT}`));
