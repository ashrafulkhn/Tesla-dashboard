// ui.js - handles DOM interactions and UI wiring
import { initMap, setPrecipitationLayer, addWeatherMarker, addManyPoints, getMap } from './map.js';
import { fetchForecast, fetchManySamplePoints } from './weather.js';

let mapInstance;
let flappyEnabled = true;

function q(id){ return document.getElementById(id) }

export function initUI(){
  mapInstance = initMap();
  setPrecipitationLayer(true);

  // initial sample points
  fetchManySamplePoints().then(points=>{
    addManyPoints(points);
    updateStats(points[0]);
  });

  // menu buttons
  document.querySelectorAll('.menu-btn').forEach(b=>b.addEventListener('click', e=>{
    document.querySelectorAll('.menu-btn').forEach(x=>x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const panel = e.currentTarget.dataset.panel;
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.querySelector('#panel-'+panel).classList.add('active');
  }));

  // theme toggle
  q('themeToggle').addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    // persist optionally
  });

  // locate
  q('locateBtn').addEventListener('click', ()=>{
    mapInstance.locate({setView:true, maxZoom:10});
  });

  mapInstance.on('locationfound', e=>{
    addWeatherMarker(e.latitude, e.longitude);
  });

  // search
  q('searchBtn').addEventListener('click', async ()=>{
    const v = q('searchInput').value.trim();
    if(!v) return;
    // if lat,lng
    const parts = v.split(',');
    if(parts.length===2){
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      addWeatherMarker(lat, lon);
      const f = await fetchForecast(lat, lon);
      renderForecast(f);
      return;
    }
    // use Nominatim for geocoding (public)
    const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(v)}`);
    const res = await geo.json();
    if(res && res[0]){
      const lat = parseFloat(res[0].lat), lon=parseFloat(res[0].lon);
      addWeatherMarker(lat, lon);
      const f = await fetchForecast(lat, lon);
      renderForecast(f);
    }
  });

  q('refreshBtn').addEventListener('click', ()=>{
    // simple refresh: re-add sample points
    fetchManySamplePoints().then(points=>addManyPoints(points));
    flash('Refreshed');
  });

  q('togglePrecip').addEventListener('click', ()=>{
    // toggle the RainViewer layer
    const enabled = !window._precipEnabled;
    setPrecipitationLayer(enabled);
    window._precipEnabled = enabled;
  });

  q('tileSelect').addEventListener('change', (e)=>{
    setPrecipitationLayer(e.target.value === 'rainviewer');
  });

  q('toggleFlap').addEventListener('click', ()=>{
    flappyEnabled = !flappyEnabled;
    document.querySelectorAll('.flappy').forEach(el=>el.style.animationPlayState = flappyEnabled ? 'running' : 'paused');
  });

  startClock();
}

function renderForecast(items){
  const c = q('forecast');
  c.innerHTML='';
  items.forEach(it=>{
    const el = document.createElement('div'); el.className='forecast-item';
    el.innerHTML = `<div>${it.date}</div><div>${it.tmax}° / ${it.tmin}°</div><div>Precip: ${it.precip}</div>`;
    c.appendChild(el);
  });
}

function updateStats(first){
  q('statTemp').textContent = first.temp + '°C';
  q('statWind').textContent = '--';
  q('statHumidity').textContent = '--';
}

function flash(msg){
  const chip = document.getElementById('statusChip');
  chip.textContent = msg;
  chip.classList.add('flash');
  setTimeout(()=>{chip.textContent='LIVE';chip.classList.remove('flash')},1200);
}

function startClock(){
  const el = q('clock');
  setInterval(()=>{
    const d = new Date();
    el.textContent = d.toLocaleTimeString();
  },1000);
}