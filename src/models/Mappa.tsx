import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, MapCameraChangedEvent, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import './Mappa.css';
import './navbar.css';
import { useNavigate } from 'react-router-dom';

type Poi = { key: number; location: google.maps.LatLngLiteral };

const initialLocations: Poi[] = [
    { key: 1, location: { lat: -33.8567844, lng: 151.213108 } }
];

const Mappa = () => {
    const [locations, setLocation] = useState<Poi[]>(initialLocations);
    const navigate = useNavigate();
    const [defaultCenter, setDefaultCenter] = useState<{ lat: number; lng: number }>({ lat: 38.115556, lng: 13.361389 });
    const [locationLoaded, setLocationLoaded] = useState(false);  // Stato per tracciare se la localizzazione è stata caricata


    // Funzione per ottenere la posizione dell'utente
    const getUserLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setDefaultCenter({ lat: latitude, lng: longitude });
                    setLocationLoaded(true); // La localizzazione è stata caricata correttamente
                },
                (error) => {
                    console.error('Errore nell\'ottenere la posizione:', error);
                    setLocationLoaded(true); // Anche in caso di errore segniamo che la localizzazione è stata caricata
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                }
            );
        } else {
            console.log('Geolocalizzazione non supportata dal browser.');
            setLocationLoaded(true); // Geolocalizzazione non disponibile nel browser
        }
    }, []);

    // Chiedere la posizione dell'utente una volta montato il componente
    useEffect(() => {
        getUserLocation();
    }, [getUserLocation]);

    const handleMapClick = useCallback((ev: MapMouseEvent) => {
        console.log('Mappa cliccata:', ev); // Log dell'evento per vedere se si attiva

        const latLng = ev.detail.latLng;

        // Accedi a lat e lng direttamente dall'oggetto latLng
        if (latLng) {
            const newKey = locations.length + 1; // Incrementa la chiave in base alla lunghezza attuale dell'array delle posizioni
            const newLocation: Poi = {
                key: newKey,
                location: { lat: latLng.lat, lng: latLng.lng } // Usa le proprietà lat() e lng() direttamente
            };

            // Aggiorna lo stato con la nuova posizione
            setLocation(prevLocations => {
                const updatedLocations = [...prevLocations, newLocation];
                console.log('Posizioni aggiornate:', updatedLocations); // Log dell'array delle posizioni aggiornato
                return updatedLocations;
            });
        } else {
            console.log('latLng non definito'); // Log se latLng non è definito
        }
    }, [locations]);

    return (
        <APIProvider apiKey={'AIzaSyC7vPnO4aSTFK7V62S-4C4TWnx-EID4Vps'} onLoad={() => console.log('API delle mappe caricata.')}>
            <div>
                <header>
                    <div>


                        <nav className="navbar navbar-expand-lg bg-light">
                            <div className="container-fluid">
                                <a className="navbar-brand" href="#">
                                    <img className="logo" src="https://www.digitality-consulting.com/wp-content/uploads/2023/02/cropped-loghi.png" alt="Bootstrap" width="30" height="24" />
                                </a>
                                <ul className="navbar-nav">
                                    <li className="nav-item">
                                        <a className="nav-link active" aria-current="page" href="#">Home</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" href="#">Link</a>
                                    </li>
                                    <li className="nav-item dropdown">
                                        <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            Dropdown
                                        </a>
                                        <ul className="dropdown-menu">
                                            <li><a className="dropdown-item" href="#">Action</a></li>
                                            <li><a className="dropdown-item" href="#">Another action</a></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><a className="dropdown-item" href="#">Something else here</a></li>
                                        </ul>
                                    </li>
                                </ul>
                                <button className="btn btn-outline-success" type="submit" onClick={() => navigate('/mappa')}>Login</button>
                            </div>
                        </nav>

                    </div>

                </header>
            </div>
            <div className='map-container'>
                <div className='map-content'>
                    <h1>Mappa dei Luoghi</h1> {/* Titolo della mappa */}
                    <div className='mappa'>
                        {locationLoaded ? (
                            <Map
                                defaultZoom={13}
                                defaultCenter={defaultCenter}
                                mapId='DEMO_MAP_ID'
                                onCameraChanged={(ev: MapCameraChangedEvent) =>
                                    console.log('Camera cambiata:', ev.detail.center, 'zoom:', ev.detail.zoom)
                                }
                                onClick={handleMapClick}
                            // Imposta il riferimento alla mappa
                            >
                                <PoiMarkers pois={locations} />
                            </Map>
                        ) : (
                            <p>Caricamento della posizione...</p>
                        )}
                    </div>
                </div>
                {/* Lista dei marker spostata all'esterno del contenitore della mappa */}
                <MarkerList locations={locations} />
            </div>
        </APIProvider>
    );
};

// Componente per visualizzare la lista dei marker
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
        console.log('Marker cliccato:', ev.latLng.toString());
        map.panTo(ev.latLng);
    }, [map]);

    useEffect(() => {
        if (map && !clusterer.current) {
            clusterer.current = new MarkerClusterer({ map });
        }
    }, [map]);

    useEffect(() => {
        if (!clusterer.current) return;

        // Pulisce i marker precedenti e aggiunge quelli nuovi
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

    return null; // Non viene restituito JSX qui
};

export default Mappa;
