import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";

const App = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any[]>([]);

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  // Fetch Lagos LGA GeoJSON from public
  useEffect(() => {
    fetch("/Lagoslga.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        fetchWeatherForLGAs(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  // Get centroid of each polygon and fetch weather
  const fetchWeatherForLGAs = async (geojson: any) => {
    const features = geojson.features;

    const weatherPromises = features.map(async (feature: any) => {
      const coords = feature.geometry.coordinates[0][0];
      const lats = coords.map((c: any) => c[1]);
      const lngs = coords.map((c: any) => c[0]);
      const lat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
      const lng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();
      return {
        name: feature.properties.LGA_NAME || "Unknown",
        lat,
        lng,
        temp: data.main?.temp,
        humidity: data.main?.humidity,
        condition: data.weather?.[0]?.description,
      };
    });

    const results = await Promise.all(weatherPromises);
    setWeatherData(results);
  };

  return (
    <div className="h-screen w-screen">
      <MapContainer
        center={[6.5244, 3.3792]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* LGA Boundaries */}
        {geoData && (
          <GeoJSON
            data={geoData}
            style={{
              color: "#1E90FF",
              weight: 2,
              fillOpacity: 0.15,
            }}
          />
        )}

        {/* Weather Markers */}
        {weatherData.map((item, i) => (
          <Marker
            key={i}
            position={[item.lat, item.lng]}
            icon={L.icon({
              iconUrl: "https://cdn-icons-png.flaticon.com/512/1116/1116453.png",
              iconSize: [30, 30],
            })}
          >
            <Popup>
              <h3 className="font-bold">{item.name}</h3>
              <p>🌡️ Temp: {item.temp}°C</p>
              <p>💧 Humidity: {item.humidity}%</p>
              <p>☁️ Condition: {item.condition}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default App;
