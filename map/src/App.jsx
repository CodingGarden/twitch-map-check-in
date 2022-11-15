/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import {
  MapContainer, TileLayer, Marker, Tooltip,
} from 'react-leaflet';
import Leaflet from 'leaflet';

import geolocate from './geolocate';
import getTwitchUser from './getTwitchUser';

const client = new tmi.Client({
  channels: ['codinggarden'],
});

const defaultIcon = Leaflet.icon({
  iconUrl:
    'https://static-cdn.jtvnw.net/jtv_user_pictures/611cac54-34e0-4c2a-851b-66e5ea2b3f81-profile_image-70x70.png',
  iconSize: [70, 70],
  tooltipAnchor: [35, 0],
  className: 'icon',
});

const existingCheckins = new Set();

function App() {
  const [map, setMap] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [displayQueue, setDisplayQueue] = useState([]);

  useEffect(() => {
    client.connect();
    client.on('message', async (channel, tags, contents) => {
      console.log(tags);
      const [command, ...args] = contents.split(' ');
      const userId = tags['user-id'];
      existingCheckins.clear();
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
            username: tags['display-name'] || tags.username,
            message: message ? message.slice(0, 140) : '',
            icon: twitchUser
              ? Leaflet.icon({
                iconUrl: twitchUser.logo,
                iconSize: [70, 70],
                tooltipAnchor: [35, 0],
                className: 'icon',
              })
              : defaultIcon,
          };
          existingCheckins.add(userId);
          setDisplayQueue((prevValue) => [...prevValue, checkIn]);
          setCheckIns((prevValue) => [...prevValue, checkIn]);
        }
      }
    });
  }, []);

  useEffect(() => {
    function setIndex() {
      setDisplayQueue((prevValue = []) => {
        const value = prevValue[0];
        if (value) {
          setTimeout(() => {
            prevValue.shift();
            setDisplayQueue([...prevValue], setIndex);
          }, 5000);
        } else {
          setTimeout(setIndex, 1000);
        }
        return prevValue;
      });
    }
    setIndex();
  }, []);

  useEffect(() => {
    if (displayQueue[0] && map) {
      map.setView([displayQueue[0].location.lat, displayQueue[0].location.long], 6, {
        animate: true,
        duration: 0.5,
      });
    } else if (map) {
      map.setView([51.505, -0.09], 3, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, displayQueue[0]]);

  return (
    <div className="app">
      <MapContainer
        whenCreated={setMap}
        className="map"
        center={[51.505, -0.09]}
        zoom={2}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        {checkIns.map((checkIn) => (
          <Marker
            key={checkIn.id}
            icon={checkIn.icon}
            position={[checkIn.location.lat, checkIn.location.long]}
          >
            {displayQueue[0] && checkIn.message
            && displayQueue[0] === checkIn ? (
              <Tooltip className="tooltip" permanent>
                {/* eslint-disable jsx-a11y/no-distracting-elements */}
                <em>{checkIn.username}</em>
                <div className="tooltip-content">
                  {checkIn.message}
                </div>
              </Tooltip>
              ) : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
