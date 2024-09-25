import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, MapCameraChangedEvent, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import './Mappa.css';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Assicurati che la configurazione di Firebase sia corretta
import { collection, getDocs, setDoc, doc } from "firebase/firestore"; // Importa setDoc e doc

type Poi = { key: string; location: google.maps.LatLngLiteral; imgage: ImageData | null };

const Mappa = () => {
    const [locations, setLocations] = useState<Poi[]>([]);
    const navigate = useNavigate();
    const [defaultCenter, setDefaultCenter] = useState<{ lat: number; lng: number }>({ lat: 38.115556, lng: 13.361389 });
    const [locationLoaded, setLocationLoaded] = useState(false);

    const getUserLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setDefaultCenter({ lat: latitude, lng: longitude });
                    setLocationLoaded(true);
                },
                (error) => {
                    console.error('Errore nell\'ottenere la posizione:', error);
                    setLocationLoaded(true);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                }
            );
        } else {
            console.log('Geolocalizzazione non supportata dal browser.');
            setLocationLoaded(true);
        }
    }, []);

    const fetchLocationsFromFirestore = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'alessandro/Markers/Poi'));
            const poiData: Poi[] = querySnapshot.docs.map(doc => ({
                key: doc.id,
                location: {
                    lat: doc.data().lat,
                    lng: doc.data().lng
                },
                imgage: null,
            }));
            setLocations(poiData);
            console.log('Posizioni ottenute da Firestore:', poiData);
        } catch (error) {
            console.error('Errore nel recupero delle posizioni da Firestore:', error);
        }
    };

    // Funzione per salvare il marker nel Firestore
    const saveMarkerToFirestore = async (marker: Poi) => {
        try {
            const markerRef = doc(collection(db, 'alessandro/Markers/Poi'), marker.key);
            await setDoc(markerRef, {
                lat: marker.location.lat,
                lng: marker.location.lng
            });
            console.log('Marker salvato nel Firestore:', marker);
        } catch (error) {
            console.error('Errore nel salvataggio del marker nel Firestore:', error);
        }
    };

    useEffect(() => {
        getUserLocation();
        fetchLocationsFromFirestore();
    }, []);

    const handleMapClick = useCallback(async (ev: MapMouseEvent) => {
        console.log('Mappa cliccata:', ev);

        const latLng = ev.detail.latLng;

        if (latLng) {
            const newKey = `${locations.length + 1}`;
            const newLocation: Poi = {
                key: newKey,
                location: { lat: latLng.lat, lng: latLng.lng },
                imgage: null,
            };

            setLocations(prevLocations => {
                const updatedLocations = [...prevLocations, newLocation];
                console.log('Posizioni aggiornate:', updatedLocations);
                return updatedLocations;
            });

            // Salva il nuovo marker in Firestore
            await saveMarkerToFirestore(newLocation);
        } else {
            console.log('latLng non definito');
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
                    <h1>Mappa dei Luoghi</h1>
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
                            >
                                <PoiMarkers pois={locations} />
                            </Map>
                        ) : (
                            <p>Caricamento della posizione...</p>
                        )}
                    </div>
                </div>
                <MarkerList locations={locations} />
            </div>
        </APIProvider>
    );
};

const MarkerList = ({ locations }: { locations: Poi[] }) => {
    return (
        <div className="marker-list">
            <h2>Markers</h2>
            <ul>
                {locations.map((poi) => (
                    <li key={poi.key}>
                        {`Lat: ${poi.location.lat}, Lng: ${poi.location.lng}`}
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
