import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, MapCameraChangedEvent, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import './Mappa.css';

type Poi = { key: number; location: google.maps.LatLngLiteral };

const initialLocations: Poi[] = [];

const Mappa = () => {
    const [locations, setLocation] = useState<Poi[]>(initialLocations);
    const [defaultLocation, setDefaultLocation] = useState<{ lat: number; lng: number }>({ lat: 38.115556, lng: 13.361389 });
    const [locationLoaded, setLocationLoaded] = useState(false);

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
                            setLocationLoaded(true);
                        },
                        (error) => {
                            console.log('Errore nella geolocalizzazione:', error);
                            setLocationLoaded(true);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0,
                        }
                    );
                } else {
                    console.log('La localizzazione non è stata concessa');
                    setLocationLoaded(true);
                }
            });
        } else {
            setLocationLoaded(true);
        }
    }, []);

    useEffect(() => {
        getUserLocation();
    }, [getUserLocation]);

    // Funzione per gestire il click sulla mappa e aggiungere un marker
    const handleMapClick = useCallback((ev: MapMouseEvent) => {
        const latLng = ev.detail.latLng;

        if (latLng) {
            const newKey = locations.length + 1;
            const newLocation: Poi = {
                key: newKey,
                location: { lat: latLng.lat, lng: latLng.lng }
            };

            setLocation(prevLocations => [...prevLocations, newLocation]);
        }
    }, [locations]);

    // Funzione per rimuovere un marker in base alla sua chiave
    const handleRemoveMarker = useCallback((key: number) => {
        setLocation(prevLocations => prevLocations.filter(location => location.key !== key));
    }, []);

    return (
        <>
            <div className='box'>
                <h1>Insert markers</h1>
                <div>
                    {locations.map((location) => (
                        <div key={location.key}>
                            <p>Marker {location.key}</p>
                            <button onClick={() => handleRemoveMarker(location.key)}>
                                Remove Marker {location.key}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <APIProvider apiKey={'AIzaSyC7vPnO4aSTFK7V62S-4C4TWnx-EID4Vps'} onLoad={() => console.log('Maps API has loaded.')}>
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
                            <PoiMarkers pois={locations} />
                        </Map>
                    ) : (
                        <p>Caricamento della posizione</p>
                    )}
                </div>
            </APIProvider>
        </>
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
