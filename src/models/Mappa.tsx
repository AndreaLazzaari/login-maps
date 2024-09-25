import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, MapCameraChangedEvent, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import './Mappa.css';

type Poi = { key: number; location: google.maps.LatLngLiteral };

const initialLocations: Poi[] = [
    { key: 0, location: { lat: 41.79565866566127, lng: 41.79565866566127 } },
    // { key: 2, location: { lat: -33.8472767, lng: 151.2188164 } },
    // { key: 3, location: { lat: -33.8209738, lng: 151.2563253 } },
];

const Mappa = () => {
    const [locations, setLocation] = useState<Poi[]>(initialLocations);
    const [defaultLocation, setDefaultLocation] = useState<{ lat: number; lng: number }>({ lat: 38.115556, lng: 13.361389 });
    const [locationLoaded, setLocationLoaded] = useState(false);  // Stato per tracciare se la localizzazione è stata caricata

    // Funzione per ottenere la posizione dell'utente
    const getUserLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted' || result.state === 'prompt') {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setDefaultLocation({ lat, lng });
                            setLocationLoaded(true); // La localizzazione è stata caricata correttamente
                        },
                        (error) => {
                            console.log('Errore nella geolocalizzazione:', error);
                            setLocationLoaded(true); // Anche in caso di errore segniamo che la localizzazione è stata caricata
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0,
                        }
                    );
                } else {
                    console.log('La localizzazione non è stata concessa');
                    setLocationLoaded(true); // La localizzazione non è stata concessa
                }
            });
        } else {
            setLocationLoaded(true); // Geolocalizzazione non disponibile nel browser
        }
    }, []);

    // Chiedere la posizione dell'utente una volta montato il componente
    useEffect(() => {
        getUserLocation();
    }, [getUserLocation]);

    // Funzione per gestire il click sulla mappa
    const handleMapClick = useCallback((ev: MapMouseEvent) => {
        console.log('Map clicked:', ev);
        const latLng = ev.detail.latLng;

        if (latLng) {
            const newKey = locations.length + 1;
            const newLocation: Poi = {
                key: newKey,
                location: { lat: latLng.lat, lng: latLng.lng } // Usa lat() e lng() correttamente
            };

            // Aggiorna lo stato con la nuova posizione
            setLocation(prevLocations => {
                const updatedLocations = [...prevLocations, newLocation];
                console.log('Updated locations:', updatedLocations);
                return updatedLocations;
            });
        } else {
            console.log('latLng is undefined');
        }
    }, [locations]);

    return (
        <>

            <div className='box'>
                <h1>
                    Inserisci i tuoi marker preferiti
                </h1>
            </div>
            <APIProvider apiKey={'AIzaSyC7vPnO4aSTFK7V62S-4C4TWnx-EID4Vps'} onLoad={() => console.log('Maps API has loaded.')}>
                <div className='contenitore'>
                    <div className='mappa'>
                        {locationLoaded ? (
                            <Map
                                defaultZoom={13}
                                defaultCenter={defaultLocation}
                                mapId='DEMO_MAP_ID'
                                onCameraChanged={(ev: MapCameraChangedEvent) =>
                                    console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
                                }
                                onClick={handleMapClick}
                            >
                                {/* imposta il riferimento alla mappa */}
                                <PoiMarkers pois={locations} />
                            </Map>
                        ) : (
                            <p>Caricamento della posizione...</p>
                        )}
                    </div>
                    <div>
                        <MarkerList locations={locations} />
                    </div>
                </div>
            </APIProvider>
        </>
    );
};

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
        console.log('marker cliccato', ev.latLng.toString());
        map.panTo(ev.latLng);
    }, [map]);

    useEffect(() => {
        if (map && !clusterer.current) {
            clusterer.current = new MarkerClusterer({ map });
        }
    }, [map]);

    useEffect(() => {
        if (!clusterer.current) return;

        // Pulisce i marker precedenti e aggiungi quelli nuovi
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

    return null;
};

export default Mappa;
