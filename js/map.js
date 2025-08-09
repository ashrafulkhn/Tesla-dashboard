// map.js
// Exports functions to initialize the map, add tile overlays, markers etc.

import { fetchWeatherForPoint } from './weather.js';

let map, markersLayer, precipLayer;

export function initMap(containerId='map'){
  map = L.map(containerId).setView([20.5937,78.9629], 4); // center India by default

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  return map;
}

export function setPrecipitationLayer(enabled=true){
  if(precipLayer){
    if(!enabled){
      map.removeLayer(precipLayer);
      precipLayer = null;
      return;
    }
    return; // already present
  }

  if(enabled){
    // RainViewer tiles (tiles animate with time) - public usage for demo
    const url = 'https://tilecache.rainviewer.com/v2/radar/{time}/{z}/{x}/{y}/2/1_1.png';
    // use epoch-based time frames; RainViewer provides recent frames — here we use 0 as placeholder; the tile server handles it sensibly
    precipLayer = L.tileLayer(url, {opacity:0.6, attribution:'RainViewer'}).addTo(map);
  }
}

export async function addWeatherMarker(lat, lon){
  if(!map) return;
  const data = await fetchWeatherForPoint(lat, lon);
  const html = `<div class=marker>
    <strong>${data.name}</strong><br>${data.temp}°C, ${data.weather}
  </div>`;
  const marker = L.marker([lat, lon]).bindPopup(html);
  markersLayer.clearLayers();
  markersLayer.addLayer(marker);
  marker.openPopup();
  map.setView([lat, lon], 8, {animate:true});
}

export function addManyPoints(points){
  markersLayer.clearLayers();
  points.forEach(p=>{
    const marker = L.circleMarker([p.lat,p.lon],{radius:8}).bindPopup(`<b>${p.name}</b><br>${p.temp}°C`);
    markersLayer.addLayer(marker);
  });
}

export function getMap(){ return map }