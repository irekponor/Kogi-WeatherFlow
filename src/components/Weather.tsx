import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface WeatherData {
  name: string;
  temperature: number;
  humidity: number;
  condition: string;
}

const Weather: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  // Load GeoJSON
  useEffect(() => {
    fetch("/Lagoslga.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  // Fetch weather data for each LGA
  const fetchWeatherForLGA = async (name: string) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${name},NG&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.cod === 200) {
      return {
        name,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        condition: data.weather[0].description,
      };
    } else {
      return { name, temperature: NaN, humidity: NaN, condition: "Unknown" };
    }
  };

  // Fetch all LGAs and update every 5 minutes
  useEffect(() => {
    const fetchAllWeather = async () => {
      if (!geoData) return;
      const names = geoData.features.map((f: any) => f.properties.name);
      const results = await Promise.all(names.map(fetchWeatherForLGA));
      setWeatherData(results);
    };

    fetchAllWeather();
    const interval = setInterval(fetchAllWeather, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, [geoData]);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 bg-gray-100 overflow-y-auto p-4 border-r border-gray-300">
        <h2 className="text-xl font-bold mb-4">🌍 Lagos LGA Weather Summary</h2>
        {weatherData.length === 0 ? (
          <p>Loading weather data...</p>
        ) : (
          weatherData.map((w) => (
            <div key={w.name} className="mb-4 p-3 bg-white rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg">{w.name}</h3>
              <p>🌡️ Temp: {isNaN(w.temperature) ? "Unknown" : `${w.temperature}°C`}</p>
              <p>💧 Humidity: {isNaN(w.humidity) ? "Unknown" : `${w.humidity}%`}</p>
              <p>☁️ Condition: {w.condition}</p>
            </div>
          ))
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        {geoData && (
          <MapContainer
            center={[6.5244, 3.3792]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <GeoJSON data={geoData} />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default Weather;
