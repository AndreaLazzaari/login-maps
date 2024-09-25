import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, MapCameraChangedEvent, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import './Mappa.css';
import { db } from '../FirebaseConfig';// Assicurati che la configurazione di Firebase sia corretta
import { collection, getDocs, setDoc, doc } from "firebase/firestore"; // Importa setDoc e doc
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type Poi = { key: string; location: google.maps.LatLngLiteral; image: string | null };

const Mappa = () => {
    const [locations, setLocation] = useState<Poi[]>([]);
    const [defaultLocation, setDefaultLocation] = useState<{ lat: number; lng: number }>({ lat: 38.115556, lng: 13.361389 });
    const [locationLoaded, setLocationLoaded] = useState(false);  // Stato per tracciare se la localizzazione è stata caricata
    const [selectedMarker, setSelectedMarker] = useState<Poi | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null); // Riferimento alla mappa
    const storage = getStorage();

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

    const fetchLocationsFromFirestore = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'Andrea/markers/Poi'));
            const poiData: Poi[] = querySnapshot.docs.map(doc => ({
                key: doc.id,
                location: {
                    lat: doc.data().lat,
                    lng: doc.data().lng
                },
                image: doc.data().image || null,
            }));
            setLocation(poiData);
            console.log('Posizioni ottenute da Firestore:', poiData);
        } catch (error) {
            console.error('Errore nel recupero delle posizioni da Firestore:', error);
        }
    };

    // Funzione per salvare il marker nel Firestore
    const saveMarkerToFirestore = async (marker: Poi) => {
        try {
            const markerRef = doc(collection(db, 'Andrea/markers/Poi'), marker.key);
            await setDoc(markerRef, {
                lat: marker.location.lat,
                lng: marker.location.lng,
                image: marker.image
            });
            console.log('Marker salvato nel Firestore:', marker);
        } catch (error) {
            console.error('Errore nel salvataggio del marker nel Firestore:', error);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, marker: Poi) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const storageRef = ref(storage, `Andrea/images/${marker.key}`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);
            const updatedMarker = { ...marker, image: imageUrl };
            setLocation(prevLocations => {
                const updatedLocations = prevLocations.map(loc => loc.key === marker.key ? updatedMarker : loc);
                return updatedLocations;
            });
            await saveMarkerToFirestore(updatedMarker);
        }
    };

    // Chiedere la posizione dell'utente una volta montato il componente
    useEffect(() => {
        getUserLocation();
        fetchLocationsFromFirestore();
    }, []);

    // Funzione per gestire il click sulla mappa
    const handleMapClick = useCallback(async (ev: MapMouseEvent) => {
        console.log('Map clicked:', ev);
        const latLng = ev.detail.latLng;

        if (latLng) {
            const newKey = `${locations.length + 1}`;
            const newLocation: Poi = {
                key: newKey,
                location: { lat: latLng.lat, lng: latLng.lng },// Usa lat() e lng() correttamente
                image: null,
            };

            // Aggiorna lo stato con la nuova posizione
            setLocation(prevLocations => {
                const updatedLocations = [...prevLocations, newLocation];
                console.log('posizioni aggiornate:', updatedLocations);
                return updatedLocations;
            });

            // Salva il nuovo marker in Firestore
            await saveMarkerToFirestore(newLocation);
        } else {
            console.log('latLng non definita');
        }
    }, [locations]);

    const handleMarkerClick = (marker: Poi) => {
        setSelectedMarker(marker);
        if (marker && marker.location && mapRef.current) {
            const googleMap = mapRef.current;
            if (googleMap) {
                googleMap.panTo(marker.location);
            } else {
                console.error("Mappa non disponibile.");
            }
        }
    };


    return (
        <>

            <div className='box'>
                <h1>
                    Inserisci i tuoi marker preferiti
                </h1>
            </div>
            <APIProvider apiKey={'AIzaSyC7vPnO4aSTFK7V62S-4C4TWnx-EID4Vps'} onLoad={() => console.log('Maps API caricata.')}>
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
                                onLoad={(map) => {
                                    mapRef.current = map;
                                    console.log("Mappa caricata:", map)
                                }}
                            >
                                {/* imposta il riferimento alla mappa */}
                                <PoiMarkers pois={locations} />
                            </Map>
                        ) : (
                            <p>Caricamento della posizione...</p>
                        )}
                    </div>
                    <div>
                        <MarkerList locations={locations} onFileChange={handleFileChange} onMarkerClick={handleMarkerClick} />
                    </div>
                </div>
            </APIProvider>
        </>
    );
};

const MarkerList = ({ locations, onFileChange, onMarkerClick }: { locations: Poi[]; onFileChange: (event: React.ChangeEvent<HTMLInputElement>, marker: Poi) => void; onMarkerClick: (marker: Poi) => void }) => {
    return (
        <div className="marker-list">
            <h2>Posizioni salvate</h2>
            <ul>
                {locations.map((poi) => (
                    <li key={poi.key} onClick={() => onMarkerClick(poi)} style={{ cursor: 'pointer' }}>
                        {`Lat: ${poi.location.lat}, Lng: ${poi.location.lng}`}
                        <input type="file" accept="image/*" onChange={(e) => onFileChange(e, poi)} />
                        {poi.image && <img src={poi.image} alt={`Marker ${poi.key}`} width={50} height={50} />}
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
        const newMarkers = props.pois.map(poi => {
            const marker = new google.maps.Marker({
                position: poi.location,
                map,
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