import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet';
import Leaflet from 'leaflet';

import geolocate from './geolocate';
import getTwitchUser from './getTwitchUser';

const client = new tmi.Client({
	channels: [ 'codinggarden' ]
});

const defaultIcon = Leaflet.icon({
  iconUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/611cac54-34e0-4c2a-851b-66e5ea2b3f81-profile_image-70x70.png',
  iconSize: [70, 70],
  tooltipAnchor: [35, 0],
  className: 'icon',
});

const existingCheckins = new Set();

function App() {
  const [map, setMap] = useState(null);
  const [visibleCheckinIndex, setVisibleCheckinIndex] = useState(0);
  const [checkIns, setCheckIns] = useState([]);

  useEffect(() => {
    client.connect();
    client.on('message', async (channel, tags, message, self) => {
      console.log(tags);
      const [command, ...args] = message.split(' ');
      const userId = tags['user-id'];
      if (command === '!check-in' && !existingCheckins.has(userId)) {
        const parts = args.join(' ');
        const [location, message] = parts.split(':');
        const result = await geolocate(location);
        const twitchUser = await getTwitchUser(userId);
        if (result !== null) {
          const checkIn = {
            id: tags.id,
            tags,
            location: result,
            message: message ? message.slice(0, 140) : '',
            icon: twitchUser ? Leaflet.icon({
              iconUrl: twitchUser.logo,
              iconSize: [70, 70],
              tooltipAnchor: [35, 0],
              className: 'icon',
            }) : defaultIcon,
          };
          console.log(checkIn);
          existingCheckins.add(userId);
          setCheckIns((prevValue) => [...prevValue, checkIn]);
        }
      }
    });
  }, []);

  useEffect(() => {
    function setIndex() {
      setVisibleCheckinIndex(prevValue => prevValue + 1);
      setTimeout(setIndex, 5500);
    }
    setIndex();
  }, []);

  useEffect(() => {
    const checkIn = checkIns[visibleCheckinIndex];
    if (checkIn && map) {
      map.setView([checkIn.location.lat, checkIn.location.long], 5, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, checkIns, visibleCheckinIndex]);



  return (
    <div className="app">
      <MapContainer whenCreated={setMap} className="map" center={[51.505, -0.09]} zoom={2}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        {checkIns.map((checkIn, index) => (
          <Marker key={checkIn.id} icon={checkIn.icon} position={[checkIn.location.lat, checkIn.location.long]}>
            {(checkIn.message && (visibleCheckinIndex % Math.max(checkIns.length, 1)) === index) ? <Tooltip className="tooltip" permanent={true}>
              <marquee>{checkIn.message}</marquee>
            </Tooltip> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default App
