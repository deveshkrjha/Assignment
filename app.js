/**
 * INTELLIGENCE FUSION DASHBOARD — app.js
 * Multi-Source OSINT / HUMINT / IMINT Visualization Engine
 */

/* ===================================================================
   DATA STORE
   =================================================================== */
const IntelDB = {
  nodes: [],
  nextId: 1,
  listeners: [],

  add(nodes) {
    nodes.forEach(n => {
      n.id = this.nextId++;
      this.nodes.push(n);
    });
    this.emit();
  },

  clear(type = null) {
    this.nodes = type ? this.nodes.filter(n => n.type !== type) : [];
    this.emit();
  },

  on(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(fn => fn(this.nodes)); }
};

/* ===================================================================
   MOCK OSINT DATA (simulates MongoDB + S3 response)
   =================================================================== */
const MOCK_OSINT_SOURCES = {
  mongodb: [
    { title: 'Signal Intercept #A1', lat: 33.3152, lng: 44.3661, summary: 'Encrypted burst transmission detected on 7.3 MHz', origin: 'MongoDB/SIGINT-DB', classification: 'SECRET', date: '2024-03-01' },
    { title: 'Social Media Cluster #B7', lat: 36.2021, lng: 37.1343, summary: '1,240 posts geotagged to conflict zone in 48hrs', origin: 'MongoDB/SOCMED-DB', classification: 'UNCLASSIFIED', date: '2024-03-02' },
    { title: 'Dark Web Mention #C3', lat: 35.6892, lng: 51.3890, summary: 'Sale of restricted materials advertised on forum', origin: 'MongoDB/DARKWEB-DB', classification: 'CONFIDENTIAL', date: '2024-03-03' },
    { title: 'Financial Trail #D2', lat: 25.2048, lng: 55.2708, summary: 'Suspicious wire transfers totaling $4.2M flagged', origin: 'MongoDB/FIN-DB', classification: 'SECRET', date: '2024-03-04' },
    { title: 'Radio Broadcast #E9', lat: 15.5527, lng: 32.5324, summary: 'State broadcaster shifts frequency — signal analysis anomaly', origin: 'MongoDB/RADIO-DB', classification: 'UNCLASSIFIED', date: '2024-03-05' },
  ],
  s3: [
    { title: 'S3 News Archive — Kabul', lat: 34.5553, lng: 69.2075, summary: '374 articles indexed. Spike in violence keywords +220%', origin: 'AWS S3/news-archive-af', classification: 'UNCLASSIFIED', date: '2024-03-06' },
    { title: 'S3 Telecom Metadata', lat: 31.5497, lng: 74.3436, summary: 'Anonymized call records show unusual cross-border spike', origin: 'AWS S3/telecom-meta-pk', classification: 'CONFIDENTIAL', date: '2024-03-07' },
    { title: 'S3 Satellite Feeds Log', lat: 29.3544, lng: 47.9821, summary: '18 new satellite passes logged; 3 anomalous objects tracked', origin: 'AWS S3/sat-feeds-kw', classification: 'SECRET', date: '2024-03-08' },
  ]
};

/* ===================================================================
   MAP INITIALIZATION
   =================================================================== */
let map;
let markersLayer = { osint: L.layerGroup(), humint: L.layerGroup(), imint: L.layerGroup() };
let filterState = { osint: true, humint: true, imint: true };

function initMap() {
  map = L.map('map', {
    center: [32, 55],
    zoom: 4,
    zoomControl: true,
    attributionControl: false
  });

  // CartoDB DarkMatter — works from local file:// with no Referer restriction
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '© OpenStreetMap contributors © CARTO'
  }).addTo(map);

  // Add layer groups to map
  Object.values(markersLayer).forEach(lg => lg.addTo(map));

  // Click on map background dismisses pinned popup
  map.on('click', () => { if (popupPinned) unpinPopup(); });
}

/* ===================================================================
   MARKER RENDERING
   =================================================================== */
const MARKER_CONFIG = {
  osint:  { color: '#00c8ff', fillColor: '#00c8ff', radius: 9 },
  humint: { color: '#f5a623', fillColor: '#f5a623', radius: 9 },
  imint:  { color: '#e040fb', fillColor: '#e040fb', radius: 9 },
};

function renderMarkers(nodes) {
  // Clear existing markers
  Object.values(markersLayer).forEach(lg => lg.clearLayers());

  nodes.forEach(node => {
    if (!isValidCoord(node.lat, node.lng)) return;
    const cfg = MARKER_CONFIG[node.type];

    const marker = L.circleMarker([node.lat, node.lng], {
      radius: cfg.radius,
      color: cfg.color,
      fillColor: cfg.fillColor,
      fillOpacity: 0.85,
      weight: 2,
      opacity: 1,
    });

    // Pulse ring
    const pulseIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:22px;height:22px;border-radius:50%;
        border:2px solid ${cfg.color};
        animation:pulseRing 1.8s ease-out infinite;
        opacity:0.5;
        position:absolute;top:-6px;left:-6px;
      "></div>`,
      iconSize: [0, 0]
    });
    const pulseMarker = L.marker([node.lat, node.lng], { icon: pulseIcon, interactive: false });

    marker.on('mouseover', (e) => showPopup(e, node));
    marker.on('mouseout', (e) => { if (!popupPinned) hidePopup(); });
    marker.on('click', (e) => {
      if (popupPinned && clickedNode === node.id) { unpinPopup(); return; }
      showPopup(e, node);
      pinPopup(node.id);
      map.stopPropagation && map.stopPropagation();
    });

    markersLayer[node.type].addLayer(marker);
    markersLayer[node.type].addLayer(pulseMarker);
  });

  // Apply filter visibility
  applyFilters();
  updateMapInfo();
  updateNodeLists();
}

function isValidCoord(lat, lng) {
  return typeof lat === 'number' && typeof lng === 'number' &&
         lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function flyToNode(node) {
  map.flyTo([node.lat, node.lng], 7, { duration: 1.2 });
}

/* ===================================================================
   HOVER POP-UP
   =================================================================== */
const popup = document.getElementById('hover-popup');
let popupPinned = false;
let clickedNode = null;

function pinPopup(nodeId) {
  popupPinned = true;
  clickedNode = nodeId;
  popup.style.border = '1px solid var(--accent-teal)';
  popup.style.boxShadow = '0 8px 40px rgba(0,0,0,0.7), 0 0 24px rgba(0,200,255,0.25)';
}

function unpinPopup() {
  popupPinned = false;
  clickedNode = null;
  hidePopup();
}

function showPopup(e, node) {
  popup.style.display = 'block';
  positionPopup(e.originalEvent);

  const badge = `<div class="popup-badge ${node.type}"><i class="fa ${typeIcon(node.type)}"></i>${node.type.toUpperCase()}</div>`;
  const title = `<div class="popup-title">${escHtml(node.title)}</div>`;
  const divider = `<div class="popup-divider"></div>`;

  let imageHtml = '';
  if (node.imageUrl) {
    imageHtml = `<img class="popup-image" src="${node.imageUrl}" alt="IMINT" />`;
  }

  const meta = buildMetaRows(node);
  popup.innerHTML = badge + title + imageHtml + divider + `<div class="popup-meta">${meta}</div>`;
}

function positionPopup(e) {
  const margin = 16;
  const pw = 310, ph = 280;
  let x = e.clientX + margin;
  let y = e.clientY + margin;
  if (x + pw > window.innerWidth)  x = e.clientX - pw - margin;
  if (y + ph > window.innerHeight) y = e.clientY - ph - margin;
  popup.style.left = x + 'px';
  popup.style.top  = y + 'px';
}

function hidePopup() { popup.style.display = 'none'; }

document.addEventListener('mousemove', (e) => {
  if (popup.style.display === 'block' && !popupPinned) positionPopup(e);
});


function typeIcon(type) {
  return { osint: 'fa-globe', humint: 'fa-user-secret', imint: 'fa-satellite' }[type] || 'fa-circle';
}

function buildMetaRows(node) {
  const fields = [];
  if (node.lat  != null) fields.push(['LAT / LNG', `${node.lat.toFixed(4)}, ${node.lng.toFixed(4)}`]);
  if (node.date) fields.push(['Date', node.date]);
  if (node.source || node.origin) fields.push(['Source', node.source || node.origin]);
  if (node.classification) fields.push(['Class', node.classification]);
  if (node.confidence) fields.push(['Confidence', node.confidence]);
  if (node.summary || node.report || node.description)
    fields.push(['Report', (node.summary || node.report || node.description).slice(0, 80) + '…']);
  if (node.filename) fields.push(['File', node.filename]);

  return fields.map(([k, v]) =>
    `<div class="popup-meta-row">
       <span class="popup-meta-key">${k}</span>
       <span class="popup-meta-val">${escHtml(String(v))}</span>
     </div>`
  ).join('');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str; return d.innerHTML;
}

/* ===================================================================
   FILTER CONTROLS
   =================================================================== */
function applyFilters() {
  Object.keys(filterState).forEach(type => {
    if (filterState[type]) {
      map.addLayer(markersLayer[type]);
    } else {
      map.removeLayer(markersLayer[type]);
    }
  });
}

function toggleFilter(type) {
  filterState[type] = !filterState[type];
  const btn = document.getElementById(`filter-${type}`);
  btn.classList.toggle('active', filterState[type]);
  applyFilters();
}

/* ===================================================================
   MAP INFO OVERLAY
   =================================================================== */
function updateMapInfo() {
  const counts = { osint: 0, humint: 0, imint: 0 };
  IntelDB.nodes.forEach(n => counts[n.type]++);
  const total = IntelDB.nodes.length;

  document.getElementById('info-total').textContent = total;
  document.getElementById('info-osint').textContent  = counts.osint;
  document.getElementById('info-humint').textContent = counts.humint;
  document.getElementById('info-imint').textContent  = counts.imint;

  // Update status pills
  updatePillCount('osint-pill-count',  counts.osint);
  updatePillCount('humint-pill-count', counts.humint);
  updatePillCount('imint-pill-count',  counts.imint);
}

function updatePillCount(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = n;
}

/* ===================================================================
   NODE LISTS IN SIDEBAR
   =================================================================== */
function updateNodeLists() {
  ['osint', 'humint', 'imint'].forEach(type => {
    const el = document.getElementById(`${type}-nodelist`);
    if (!el) return;
    const nodes = IntelDB.nodes.filter(n => n.type === type);
    const countEl = document.getElementById(`${type}-count`);
    if (countEl) countEl.textContent = nodes.length;

    if (nodes.length === 0) {
      el.innerHTML = '<div class="no-data">No data loaded.</div>';
      return;
    }
    el.innerHTML = nodes.slice(-8).reverse().map(n => `
      <div class="node-item" onclick="flyToNode({lat:${n.lat},lng:${n.lng}})">
        <div class="node-dot" style="background:${MARKER_CONFIG[type].color}; box-shadow:0 0 6px ${MARKER_CONFIG[type].color}"></div>
        <div class="node-name">${escHtml(n.title)}</div>
        <div class="node-coords">${n.lat.toFixed(2)},${n.lng.toFixed(2)}</div>
      </div>
    `).join('');
  });
}

/* ===================================================================
   OSINT — SIMULATED FETCH
   =================================================================== */
async function fetchOSINT(source = 'all') {
  const btn = document.getElementById('osint-fetch-btn');
  const status = document.getElementById('osint-status');
  setButtonLoading(btn, true);
  showStatus(status, 'info', 'Connecting to intelligence sources…');

  await sleep(1200);

  let data = [];
  if (source === 'mongodb' || source === 'all') data = data.concat(MOCK_OSINT_SOURCES.mongodb);
  if (source === 's3'      || source === 'all') data = data.concat(MOCK_OSINT_SOURCES.s3);

  await sleep(600);

  const nodes = data.map(d => ({ ...d, type: 'osint' }));
  IntelDB.add(nodes);
  showStatus(status, 'ok', `✓ Loaded ${nodes.length} OSINT records from ${source === 'all' ? 'MongoDB + S3' : source}`);
  setButtonLoading(btn, false);
}

/* ===================================================================
   HUMINT — FILE INGESTION (CSV / JSON / Excel)
   =================================================================== */
function initHumintDropZone() {
  const zone = document.getElementById('humint-dropzone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    handleHumintFiles(e.dataTransfer.files);
  });

  document.getElementById('humint-file-input').addEventListener('change', e => {
    handleHumintFiles(e.target.files);
    e.target.value = '';
  });
}

function handleHumintFiles(files) {
  const status = document.getElementById('humint-status');
  if (!files.length) return;

  Array.from(files).forEach(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') parseCSV(file, status);
    else if (ext === 'json') parseJSON(file, status);
    else if (ext === 'xlsx' || ext === 'xls') parseExcel(file, status);
    else showStatus(status, 'err', `Unsupported file: ${file.name}`);
  });
}

function parseCSV(file, status) {
  showStatus(status, 'info', `Parsing ${file.name}…`);
  Papa.parse(file, {
    header: true, skipEmptyLines: true,
    complete(results) {
      const nodes = results.data.map(r => normalizeHumint(r)).filter(Boolean);
      if (!nodes.length) { showStatus(status, 'err', 'No valid rows found (need lat/lng columns)'); return; }
      IntelDB.add(nodes);
      showStatus(status, 'ok', `✓ Loaded ${nodes.length} HUMINT records from ${file.name}`);
    },
    error(err) { showStatus(status, 'err', `CSV error: ${err.message}`); }
  });
}

function parseJSON(file, status) {
  showStatus(status, 'info', `Parsing ${file.name}…`);
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) data = [data];
      const nodes = data.map(r => normalizeHumint(r)).filter(Boolean);
      if (!nodes.length) { showStatus(status, 'err', 'No valid objects with lat/lng found'); return; }
      IntelDB.add(nodes);
      showStatus(status, 'ok', `✓ Loaded ${nodes.length} HUMINT records from ${file.name}`);
    } catch(err) { showStatus(status, 'err', `JSON parse error: ${err.message}`); }
  };
  reader.readAsText(file);
}

function parseExcel(file, status) {
  showStatus(status, 'info', `Parsing ${file.name}…`);
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const nodes = data.map(r => normalizeHumint(r)).filter(Boolean);
      if (!nodes.length) { showStatus(status, 'err', 'No valid rows with lat/lng found'); return; }
      IntelDB.add(nodes);
      showStatus(status, 'ok', `✓ Loaded ${nodes.length} HUMINT records from ${file.name}`);
    } catch(err) { showStatus(status, 'err', `Excel parse error: ${err.message}`); }
  };
  reader.readAsArrayBuffer(file);
}

function normalizeHumint(row) {
  // Accept various lat/lng column name spellings
  const lat = parseFloat(row.lat ?? row.latitude ?? row.Lat ?? row.Latitude);
  const lng = parseFloat(row.lng ?? row.lon ?? row.longitude ?? row.Lng ?? row.Lon ?? row.Longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  return {
    type: 'humint',
    title: row.title || row.Title || row.name || row.Name || 'HUMINT Report',
    lat, lng,
    report: row.report || row.Report || row.description || row.Description || row.summary || '',
    source: row.source || row.Source || row.agent || '',
    date: row.date || row.Date || '',
    confidence: row.confidence || row.Confidence || '',
  };
}

/* ===================================================================
   IMINT — IMAGE UPLOAD (JPG / JPEG)
   =================================================================== */
function initImintDropZone() {
  const zone = document.getElementById('imint-dropzone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    handleImintFiles(e.dataTransfer.files);
  });

  document.getElementById('imint-file-input').addEventListener('change', e => {
    handleImintFiles(e.target.files);
    e.target.value = '';
  });
}

function handleImintFiles(files) {
  const status = document.getElementById('imint-status');
  Array.from(files).forEach(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg','jpeg','png','tif','tiff'].includes(ext)) {
      showStatus(status, 'err', `Unsupported image format: ${file.name}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      // Parse coordinates from filename: name_LAT_LNG.jpg (e.g., target_34.55_69.21.jpg)
      const coords = extractCoordsFromFilename(file.name);
      const node = {
        type: 'imint',
        title: file.name.replace(/\.[^.]+$/, ''),
        lat: coords ? coords.lat : (25 + Math.random() * 25),
        lng: coords ? coords.lng : (40 + Math.random() * 40),
        imageUrl: e.target.result,
        filename: file.name,
        date: new Date().toISOString().slice(0, 10),
        source: 'IMINT Upload',
        classification: 'RESTRICTED',
        description: `Satellite/aerial image uploaded: ${file.name}`,
        fileSize: formatBytes(file.size),
        resolution: ext.toUpperCase(),
      };
      IntelDB.add([node]);
      showStatus(status, 'ok', `✓ Img loaded: ${file.name}${coords ? '' : ' (random coords — name as "title_LAT_LNG.jpg" to set location)'}`);
    };
    reader.readAsDataURL(file);
  });
}

function extractCoordsFromFilename(name) {
  // Matches patterns like: something_34.5553_69.2075.jpg
  const m = name.match(/[_\-\s]([-\d.]+)[_\-\s]([-\d.]+)\.[a-z]+$/i);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

/* ===================================================================
   UTILITY HELPERS
   =================================================================== */
function showStatus(el, type, msg) {
  el.className = `status-msg ${type} show`;
  el.textContent = msg;
}

function setButtonLoading(btn, loading) {
  const icon = btn.querySelector('i');
  btn.disabled = loading;
  if (loading) { icon.className = 'fa fa-spinner spin'; }
  else          { icon.className = 'fa fa-cloud-download'; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ===================================================================
   PANEL COLLAPSE / EXPAND
   =================================================================== */
function initPanels() {
  document.querySelectorAll('.panel-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const collapsed = body.classList.toggle('hidden');
      header.classList.toggle('collapsed', collapsed);
    });
  });
}

/* ===================================================================
   CLEAR DATA
   =================================================================== */
function clearAllData() {
  IntelDB.clear();
  ['osint','humint','imint'].forEach(t => showStatus(document.getElementById(`${t}-status`), 'info', 'Data cleared.'));
}

function clearTypeData(type) {
  IntelDB.clear(type);
  showStatus(document.getElementById(`${type}-status`), 'info', `${type.toUpperCase()} data cleared.`);
}

/* ===================================================================
   BOOT
   =================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initPanels();
  initHumintDropZone();
  initImintDropZone();

  // Register re-render on any DB change
  IntelDB.on(renderMarkers);

  // Filter buttons
  ['osint','humint','imint'].forEach(type => {
    const btn = document.getElementById(`filter-${type}`);
    if (btn) btn.addEventListener('click', () => toggleFilter(type));
  });

  // Initial counts
  updateMapInfo();
  updateNodeLists();

  // Auto-fetch a small OSINT seed after a short delay
  setTimeout(() => fetchOSINT('mongodb'), 1800);
});
