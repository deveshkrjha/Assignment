# 🛡️ StratFusion — Strategic Intelligence Fusion Dashboard

> A real-time, multi-source intelligence visualization platform that centralizes **OSINT**, **HUMINT**, and **IMINT** data streams onto an interactive geospatial terrain map.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat&logo=leaflet&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
  - [OSINT — Open Source Intelligence](#1-osint--open-source-intelligence)
  - [HUMINT — Human Intelligence](#2-humint--human-intelligence)
  - [IMINT — Imagery Intelligence](#3-imint--imagery-intelligence)
- [Sample Data Formats](#sample-data-formats)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**StratFusion** is a client-side intelligence dashboard designed for analysts and operations teams who need to fuse multiple intelligence disciplines into a single common operating picture. The dashboard renders all intelligence nodes as interactive markers on a dark-themed Leaflet.js map with hover-activated metadata pop-ups, pulse animations, and per-layer filtering.

The application runs entirely in the browser — no backend server is required. Data is ingested via simulated cloud fetch (OSINT), file upload/drag-and-drop (HUMINT), and image upload with embedded coordinates (IMINT).

---

## Key Features

| Feature | Description |
|---|---|
| 🌐 **OSINT Auto-Fetch** | Simulates pulling intelligence from MongoDB and AWS S3 cloud sources with a single click |
| 🕵️ **HUMINT File Ingestion** | Drag-and-drop support for CSV, JSON, and Excel (.xlsx) field report files |
| 🛰️ **IMINT Image Upload** | Upload satellite/aerial imagery (JPG, PNG, TIF) with filename-embedded coordinates |
| 🗺️ **Interactive Dark Map** | CartoDB DarkMatter base layer with animated pulse markers and fly-to navigation |
| 🎯 **Hover & Click Pop-ups** | Rich metadata tooltips that follow cursor on hover and pin on click |
| 🔀 **Layer Filtering** | Toggle OSINT / HUMINT / IMINT layers independently using the filter bar |
| 📊 **Live Status Pills** | Real-time counters in the top bar showing active node counts per intelligence type |
| 📁 **Collapsible Panels** | Each intel stream has its own collapsible sidebar panel with data preview |
| 🧹 **Data Management** | Clear all data or clear by individual intelligence type |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5 / CSS3** | Structure and styling with CSS custom properties, glassmorphism, and micro-animations |
| **Vanilla JavaScript** | Application logic, event-driven data store, and DOM manipulation |
| **[Leaflet.js](https://leafletjs.com/) v1.9.4** | Interactive map rendering with tile layers, circle markers, and layer groups |
| **[PapaParse](https://www.papaparse.com/) v5.4.1** | CSV parsing for HUMINT file uploads |
| **[SheetJS (xlsx)](https://sheetjs.com/) v0.18.5** | Excel file parsing for HUMINT .xlsx/.xls uploads |
| **[Font Awesome](https://fontawesome.com/) v6.5** | Icons throughout the UI |
| **[Google Fonts](https://fonts.google.com/)** | Inter (UI text) and JetBrains Mono (data/monospace) |

---

## Project Structure

```
Assignment/
├── index.html              # Main HTML — layout, sidebar panels, map container
├── app.js                  # Core application logic — data store, map, ingestion engines
├── style.css               # Full design system — dark theme, animations, components
├── sample_humint.json      # Sample HUMINT data (JSON format, 3 records)
├── sample_humint.csv       # Sample HUMINT data (CSV format, 6 records)
└── README.md               # This file
```

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- No Node.js, npm, or any build tools required

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/stratfusion-dashboard.git
   cd stratfusion-dashboard
   ```

2. **Open in browser**
   ```
   Simply double-click index.html — or use a local dev server:
   ```
   ```bash
   # Using Python
   python -m http.server 8080

   # Using Node (if available)
   npx serve .

   # Using VS Code
   # Install "Live Server" extension → Right-click index.html → "Open with Live Server"
   ```

3. **That's it!** The dashboard will load and auto-fetch a seed batch of OSINT data after ~2 seconds.

---

## Usage Guide

### 1. OSINT — Open Source Intelligence

> **Panel:** Top section in the sidebar (🌐 globe icon)

- Select a data source from the dropdown:
  - **All Sources** — Fetches from both MongoDB + S3
  - **MongoDB / SIGINT-DB** — Signal intercepts, social media, dark web, financial intel
  - **AWS S3 Archives** — News archives, telecom metadata, satellite feed logs
- Click **"Fetch OSINT Data"** to pull records
- The map instantly renders teal-colored markers at each intelligence location

### 2. HUMINT — Human Intelligence

> **Panel:** Middle section in the sidebar (🕵️ agent icon)

- **Drag and drop** a file onto the upload zone — or click to browse
- Supported formats: `.csv`, `.json`, `.xlsx`
- **Required columns:** `lat`, `lng`, `title`
- Optional columns: `report`, `source`, `date`, `confidence`
- Use the provided sample files to test:
  - `sample_humint.csv` — 6 field reports with agent sources
  - `sample_humint.json` — 3 field reports in JSON array format

### 3. IMINT — Imagery Intelligence

> **Panel:** Bottom section in the sidebar (🛰️ satellite icon)

- **Drag and drop** satellite or aerial imagery (JPG, PNG, TIF)
- To set a precise map location, encode coordinates in the filename:
  ```
  target_34.5553_69.2075.jpg
  recon_36.20_37.13.png
  ```
  Format: `name_LAT_LNG.extension`
- If no coordinates are found in the filename, a random location is assigned
- Uploaded images appear as thumbnails in the hover pop-up

### Map Controls

| Action | Behavior |
|---|---|
| **Hover** a marker | Shows metadata pop-up that follows cursor |
| **Click** a marker | Pins the pop-up in place |
| **Click** the map background | Dismisses a pinned pop-up |
| **Click** a node in the sidebar | Flies the map to that marker's location |
| **Toggle** filter buttons | Show/hide entire intelligence layers |
| **Clear All** (top bar) | Removes all loaded data |

---

## Sample Data Formats

### CSV Format (`sample_humint.csv`)

```csv
title,lat,lng,report,source,date,confidence
Forward Base Alpha,34.5553,69.2075,Troops observed moving south,Agent 7,2024-01-15,HIGH
Checkpoint Bravo,33.9391,67.7100,Civilian evacuation in progress,Agent 12,2024-01-16,MEDIUM
```

### JSON Format (`sample_humint.json`)

```json
[
  {
    "title": "Harbor Watch Station",
    "lat": 36.8969,
    "lng": 30.7133,
    "report": "Unusual naval vessel movement observed at 0300 hrs",
    "source": "Maritime Asset A",
    "date": "2024-02-01",
    "confidence": "HIGH"
  }
]
```

### IMINT Filename Convention

```
<descriptive-name>_<latitude>_<longitude>.<extension>
Example: surveillance_33.31_44.37.jpg
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      index.html                          │
│  ┌──────────┐   ┌──────────────────────────────────────┐ │
│  │ Sidebar  │   │           Leaflet Map                │ │
│  │          │   │                                      │ │
│  │ ┌──────┐ │   │   ┌───┐  ┌───┐  ┌───┐              │ │
│  │ │OSINT │ │   │   │ ● │  │ ● │  │ ● │  ← markers   │ │
│  │ ├──────┤ │   │   └───┘  └───┘  └───┘              │ │
│  │ │HUMINT│ │   │                                      │ │
│  │ ├──────┤ │   │         CartoDB Dark Tiles           │ │
│  │ │IMINT │ │   │                                      │ │
│  │ └──────┘ │   └──────────────────────────────────────┘ │
│  │ Filters  │                                            │
│  └──────────┘                                            │
└──────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────────────┐
│                       app.js                            │
│                                                         │
│  IntelDB (Event-Driven Data Store)                      │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ .add()  │  │ .clear()    │  │ .on() / .emit()  │    │
│  └────┬────┘  └──────┬──────┘  └────────┬─────────┘    │
│       │              │                   │              │
│       ▼              ▼                   ▼              │
│  ┌───────────────────────────────────────────────┐      │
│  │ renderMarkers() → updateMapInfo()             │      │
│  │ → updateNodeLists() → applyFilters()          │      │
│  └───────────────────────────────────────────────┘      │
│                                                         │
│  Data Ingestion:                                        │
│  ├── fetchOSINT()      ← Mock cloud APIs                │
│  ├── parseCSV()        ← PapaParse                      │
│  ├── parseJSON()       ← FileReader API                 │
│  ├── parseExcel()      ← SheetJS / XLSX                 │
│  └── handleImintFiles()← FileReader + DataURL           │
└─────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User triggers data ingestion (fetch / upload / drop)
2. Raw data is normalized and pushed into `IntelDB.add()`
3. `IntelDB` emits a change event
4. `renderMarkers()` listener fires, updating the map, sidebar lists, and counters
5. Filters are re-applied to show/hide layer groups

---

## Screenshots

> Open `index.html` in your browser to see the live dashboard. Below is a description of what you'll see:

- **Dark-themed map** centered on the Middle East / Central Asia region
- **Teal markers** (OSINT) auto-populate after 2 seconds
- **Amber markers** (HUMINT) appear when you upload the sample CSV or JSON
- **Magenta markers** (IMINT) appear when you upload satellite imagery
- **Pulsing ring animations** around each marker for visual prominence
- **Glassmorphic sidebar** with collapsible intelligence panels

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-intel-source`)
3. Commit your changes (`git commit -m 'Add SIGINT panel'`)
4. Push to the branch (`git push origin feature/new-intel-source`)
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ☕ and operational necessity.<br>
  <strong>StratFusion</strong> — See the battlefield. Fuse the intelligence. Act decisively.
</p>
