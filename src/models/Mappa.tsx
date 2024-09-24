import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, MapCameraChangedEvent, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import './Mappa.css';

type Poi = { key: number; location: google.maps.LatLngLiteral };

const initialLocations: Poi[] = [];

const Mappa = () => {
    const [locations, setLocation] = useState<Poi[]>(initialLocations);
    const [defaultCenter, setDefaultCenter] = useState<{ lat: number; lng: number }>({ lat: 38.115556, lng: 13.361389 });
    const mapRef = useRef<google.maps.Map | null>(null); // Riferimento per la mappa

    useEffect(() => {
        const getLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setDefaultCenter({ lat: latitude, lng: longitude });

                        // Ricarica la pagina se la mappa è caricata
                        if (mapRef.current) {
                            window.location.reload(); // Ricarica la pagina
                        }
                    },
                    (error) => {
                        console.error('Error obtaining location:', error);
                    }
                );
            } else {
                console.log('Geolocation is not supported by this browser.');
            }
        };

        getLocation();
    }, []);

    const handleMapClick = useCallback((ev: MapMouseEvent) => {
        console.log('Map clicked:', ev); // Log the event to see if it’s firing

        const latLng = ev.detail.latLng;

        // Access lat and lng directly from the latLng object
        if (latLng) {
            const newKey = locations.length + 1; // Increment the key based on the current locations array length
            const newLocation: Poi = {
                key: newKey,
                location: { lat: latLng.lat, lng: latLng.lng } // Use lat and lng properties directly
            };

            // Update the state with the new location
            setLocation(prevLocations => {
                const updatedLocations = [...prevLocations, newLocation];
                console.log('Updated locations:', updatedLocations); // Log the updated locations array
                return updatedLocations;
            });
        } else {
            console.log('latLng is undefined'); // Log if latLng is not defined
        }
    }, [locations]);

    return (
        <APIProvider apiKey={'AIzaSyC7vPnO4aSTFK7V62S-4C4TWnx-EID4Vps'} onLoad={() => console.log('Maps API has loaded.')}>
            <div className='map-container'>
                <div className='map-content'>


                    <h1>Mappa dei Luoghi</h1> {/* Titolo della mappa */}
                    <div className='mappa'>
                        <Map
                            defaultZoom={13}
                            defaultCenter={defaultCenter}
                            mapId='DEMO_MAP_ID'
                            onCameraChanged={(ev: MapCameraChangedEvent) =>
                                console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
                            }
                            onClick={handleMapClick}
                        >
                            <PoiMarkers pois={locations} />
                        </Map>
                    </div>
                </div>
                {/* List of markers moved outside the map-container */}
                <MarkerList locations={locations} />
            </div>
        </APIProvider>
    );
};

// Component to display the list of markers
const MarkerList = ({ locations }: { locations: Poi[] }) => {
    return (
        <div className="marker-list">
            <h2>Posizioni salvate</h2>
            <ul>
                {locations.slice().map((poi) => (
                    <li key={poi.key}>
                        Posizione {poi.key}: Lat {poi.location.lat}, Lng {poi.location.lng}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const PoiMarkers = (props: { pois: Poi[] }) => {
    const map = useMap();
    const clusterer = useRef<MarkerClusterer | null>(null);

    const handleClick = useCallback((ev: google.maps.MapMouseEvent) => {
        if (!map || !ev.latLng) return;
        console.log('marker clicked:', ev.latLng.toString());
        map.panTo(ev.latLng);
    }, [map]);

    useEffect(() => {
        if (map && !clusterer.current) {
            clusterer.current = new MarkerClusterer({ map });
        }
    }, [map]);

    useEffect(() => {
        if (!clusterer.current) return;

        // Clear previous markers and add new ones
        clusterer.current.clearMarkers();
        const newMarkers = props.pois.map((poi) => {
            const marker = new google.maps.Marker({
                position: poi.location,
                map: map,
                title: `Marker ${poi.key}`,
            });

            marker.addListener('click', handleClick);
            return marker;
        });

        clusterer.current.addMarkers(newMarkers);
    }, [props.pois, handleClick]);

    return null; // No JSX is returned here
};

export default Mappa;
