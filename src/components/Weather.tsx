import React, { useEffect, useState, useRef } from "react";
import { MapContainer, GeoJSON, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface WeatherData {
  name: string;
  temperature: number;
  humidity: number;
  condition: string;
  lat: number;
  lng: number;
}

const Weather: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetch("/Lagoslga.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  const fetchWeatherForLGA = async (name: string, coords: [number, number]) => {
    let [lng, lat] = coords;

    let url = `https://api.openweathermap.org/data/2.5/weather?q=${name},NG&appid=${API_KEY}&units=metric`;
    let res = await fetch(url);
    let data = await res.json();

    if (data.cod !== 200) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
      res = await fetch(url);
      data = await res.json();
    }

    if (data.cod === 200) {
      return {
        name,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        condition: data.weather[0].description,
        lat,
        lng,
      };
    } else {
      return { name, temperature: NaN, humidity: NaN, condition: "Unknown", lat, lng };
    }
  };

  useEffect(() => {
    const fetchAllWeather = async () => {
      if (!geoData) return;
      const results = await Promise.all(
        geoData.features.map((f: any) => {
          const name = f.properties.name;
          const coords = f.geometry.coordinates[0][0][0];
          return fetchWeatherForLGA(name, coords);
        })
      );
      setWeatherData(results);
    };

    fetchAllWeather();
    const interval = setInterval(fetchAllWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [geoData]);

  const ZoomToLGA: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lng], 14, { duration: 2.0 });
    }, [lat, lng]);
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-1/4 bg-gray-100 max-md:hidden overflow-y-auto p-4 border-r border-gray-300">
        <h2 className="text-xl font-bold mb-4">Lagos LGA Weather Summary</h2>
        {weatherData.length === 0 ? (
          <p>Loading weather data...</p>
        ) : (
          weatherData.map((w) => (
            <div
              key={w.name}
              onClick={() => setSelected(w.name)}
              className={`mb-4 p-3 rounded-xl shadow-sm cursor-pointer ${
                selected === w.name ? "bg-blue-100 border border-blue-400" : "bg-white"
              }`}
            >
              <h3 className="font-semibold text-lg">{w.name}</h3>
              <p>🌡️ Temp: {isNaN(w.temperature) ? "Unknown" : `${w.temperature}°C`}</p>
              <p>💧 Humidity: {isNaN(w.humidity) ? "Unknown" : `${w.humidity}%`}</p>
              <p>☁️ Condition: {w.condition}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex-1">
        {geoData && (
          <MapContainer
            center={[6.5244, 3.3792]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
               //@ts-ignore: acessToken is valid at runtime even if type is missing
            whenReady={(mapInstance: L.Map | null) => (mapRef.current = mapInstance)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <GeoJSON data={geoData} style={{ color: "#3b82f6", weight: 1, fillOpacity: 0.1 }} />

            {weatherData.map((item, i) => (
              <Marker
                key={i}
                position={[item.lat, item.lng]}
                icon={L.icon({
                  iconUrl: "https://cdn-icons-png.flaticon.com/512/1116/1116453.png",
                  iconSize: [34, 34],
                })}
              >
                <Popup>
                  <h3 className="font-bold">{item.name}</h3>
                  <p>🌡️ Temp: {isNaN(item.temperature) ? "N/A" : `${item.temperature}°C`}</p>
                  <p>💧 Humidity: {isNaN(item.humidity) ? "N/A" : `${item.humidity}%`}</p>
                  <p>☁️ Condition: {item.condition || "N/A"}</p>
                </Popup>
                {selected === item.name && <ZoomToLGA lat={item.lat} lng={item.lng} />}
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default Weather;
