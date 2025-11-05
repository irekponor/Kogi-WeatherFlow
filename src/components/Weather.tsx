import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

const Weather = () => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/Lagoslga.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

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
        {geoData && (
          <GeoJSON
            data={geoData}
            style={{
              color: "#1E90FF",
              weight: 2,
              fillOpacity: 0.2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Weather;
