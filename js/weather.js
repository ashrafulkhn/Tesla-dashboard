// weather.js
// Fetches weather data using Open-Meteo (no API key required)

const OM_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export async function fetchWeatherForPoint(lat, lon){
  // Build request for current weather and short hourly
  const url = `${OM_ENDPOINT}?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  try{
    const res = await fetch(url);
    const json = await res.json();
    // normalize response
    const out = {
      name: json.timezone || `${lat.toFixed(2)},${lon.toFixed(2)}`,
      temp: json.current_weather ? json.current_weather.temperature : '--',
      wind: json.current_weather ? json.current_weather.windspeed : '--',
      weather: json.current_weather ? (json.current_weather.weathercode || 'N/A') : 'N/A',
      raw: json
    };
    return out;
  }catch(err){
    console.error('weather fetch failed',err);
    return {name:'unknown', temp:'--', wind:'--', weather:'err'};
  }
}

export async function fetchForecast(lat, lon){
  const url = `${OM_ENDPOINT}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  try{
    const res = await fetch(url);
    const json = await res.json();
    // produce 5-day simple array
    const days = (json.daily?.time || []).slice(0,5).map((d,i)=>({
      date: d,
      tmax: json.daily.temperature_2m_max[i],
      tmin: json.daily.temperature_2m_min[i],
      precip: json.daily.precipitation_sum[i]
    }));
    return days;
  }catch(err){
    console.error('forecast fail',err);
    return [];
  }
}

export async function fetchManySamplePoints(){
  // Return a few sample cities with coordinates
  const cities = [
    {name:'New Delhi', lat:28.6139, lon:77.2090},
    {name:'Mumbai', lat:19.0760, lon:72.8777},
    {name:'Bengaluru', lat:12.9716, lon:77.5946},
    {name:'Kolkata', lat:22.5726, lon:88.3639}
  ];
  const promises = cities.map(async c => {
    const w = await fetchWeatherForPoint(c.lat, c.lon);
    return {name:c.name, lat:c.lat, lon:c.lon, temp:w.temp};
  });
  return Promise.all(promises);
}