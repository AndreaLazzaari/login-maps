import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, MapCameraChangedEvent, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import './Mappa.css';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Cookies from 'js-cookie';

type Poi = { key: string; location: google.maps.LatLngLiteral; image: string | null; desc: string | null };

const Mappa = () => {
    const [locations, setLocations] = useState<Poi[]>([]);
    const navigate = useNavigate();
    const [defaultCenter, setDefaultCenter] = useState<{ lat: number; lng: number }>({ lat: 38.115556, lng: 13.361389 });
    const [locationLoaded, setLocationLoaded] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [editingDesc, setEditingDesc] = useState<{ [key: string]: string }>({});

    const storage = getStorage();

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

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            setIsLoggedIn(true);
            console.log('Sei loggato');
        } else {
            setIsLoggedIn(false);

            console.log('Non sei loggato');
        }
    }, [navigate]);

    const fetchLocationsFromFirestore = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'alessandro/Markers/Poi'));
            const poiData: Poi[] = querySnapshot.docs.map(doc => ({
                key: doc.id,
                location: {
                    lat: doc.data().lat,
                    lng: doc.data().lng
                },
                image: doc.data().image || null,
                desc: doc.data().desc || null
            }));
            setLocations(poiData);
            console.log('Posizioni ottenute da Firestore:', poiData);
        } catch (error) {
            console.error('Errore nel recupero delle posizioni da Firestore:', error);
        }
    };

    const saveMarkerToFirestore = async (marker: Poi) => {
        try {
            const markerRef = doc(collection(db, 'alessandro/Markers/Poi'), marker.key);
            await setDoc(markerRef, {
                lat: marker.location.lat,
                lng: marker.location.lng,
                image: marker.image,
                desc: marker.desc
            });
            console.log('Marker salvato nel Firestore:', marker);
        } catch (error) {
            console.error('Errore nel salvataggio del marker nel Firestore:', error);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, marker: Poi) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const storageRef = ref(storage, `Alessandro/images/${marker.key}`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);

            const updatedMarker = { ...marker, image: imageUrl };
            setLocations(prevLocations => {
                const updatedLocations = prevLocations.map(loc => loc.key === marker.key ? updatedMarker : loc);
                return updatedLocations;
            });

            await saveMarkerToFirestore(updatedMarker);
        }
    };

    useEffect(() => {
        getUserLocation();
        fetchLocationsFromFirestore();
    }, []);

    const handleMapClick = useCallback(async (ev: MapMouseEvent) => {
        if (!isLoggedIn) {
            alert('devi effettuare il login per salvare la posizione')
        }
        else {
            console.log('Mappa cliccata:', ev);

            const latLng = ev.detail.latLng;

            if (latLng) {
                const newKey = `${locations.length + 1}`;
                const newLocation: Poi = {
                    key: newKey,
                    location: { lat: latLng.lat, lng: latLng.lng },
                    image: null,
                    desc: null,
                };

                setLocations(prevLocations => {
                    const updatedLocations = [...prevLocations, newLocation];
                    console.log('Posizioni aggiornate:', updatedLocations);
                    return updatedLocations;
                });

                await saveMarkerToFirestore(newLocation);
            } else {
                console.log('latLng non definito');
            }

        }

    }, [isLoggedIn, locations]);

    const handleLogout = () => {
        Cookies.remove('token');
        setIsLoggedIn(false);

        console.log('Logout effettuato');
    };
    const onDescriptionChange = async (newDescription: string, marker: Poi) => {
        const updatedMarker = { ...marker, desc: newDescription };

        setLocations(prevLocations => {
            const updatedLocations = prevLocations.map(loc => loc.key === marker.key ? updatedMarker : loc);
            return updatedLocations;
        });

        await saveMarkerToFirestore(updatedMarker);
    };


    return (
        <APIProvider apiKey={'AIzaSyC7vPnO4aSTFK7V62S-4C4TWnx-EID4Vps'} onLoad={() => console.log('API delle mappe caricata.')}>
            <div>
                <header>
                    <div>
                        <nav className="navbar navbar-expand-lg bg-light">
                            <div className="container-fluid">
                                <a className="navbar-brand" href="#">
                                    <img className="logo2" src="https://www.digitality-consulting.com/wp-content/uploads/2023/02/cropped-loghi.png" alt="Bootstrap" width="30" height="24" />

                                </a>
                                <h3>Digitality Consulting</h3>


                                {isLoggedIn ? (
                                    <button className="custom-button logout" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> </button>
                                ) : (
                                    <button className="login-button2" onClick={() => navigate('/mappa')}>Login</button>
                                )}
                            </div>
                        </nav>
                    </div>
                </header>
            </div>

            <div className='map-container'>
                <div className='map-content '>
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
                <MarkerList locations={locations} onFileChange={handleFileChange} onDescriptionChange={onDescriptionChange} isLoggedIn={isLoggedIn} />
            </div>
        </APIProvider>
    );
};
const MarkerList = ({ locations, onFileChange, onDescriptionChange, isLoggedIn }: { locations: Poi[]; onFileChange: (event: React.ChangeEvent<HTMLInputElement>, marker: Poi) => void, onDescriptionChange: (newDescription: string, marker: Poi) => void, isLoggedIn: boolean }) => {

    const handleSaveDesc = (marker: Poi) => {
        const newDescription = marker.desc || "";
        onDescriptionChange(newDescription, marker);
    };

    return (
        <div className="container ">
            <h2 className='header'>Markers</h2>

            <div className="marker-list scrollable-element decorative-frame">


                <ul>
                    {locations.map((poi) => (
                        <li key={poi.key}>
                            <h6>posizione {poi.key}</h6>
                            <input
                                type="text"
                                placeholder="Modifica descrizione"
                                value={poi.desc ?? ''} // Assicurati che 'description' sia una proprietà del tuo oggetto 'poi'
                                onChange={(e) => onDescriptionChange(e.target.value, poi)} // Funzione per gestire il cambiamento
                            />
                            {/* Pulsante per salvare la descrizione */}
                            <button onClick={() => handleSaveDesc(poi)}>
                                Salva descrizione
                            </button>
                            {isLoggedIn && ( // Mostra l'input solo se isLoggedIn è true
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => onFileChange(e, poi)}
                                />
                            )}
                            {poi.image && <img src={poi.image} alt={`Marker ${poi.key}`} width={50} height={50} />}
                        </li>
                    ))}
                </ul>
            </div>
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

        clusterer.current.clearMarkers();
        const markers = props.pois.map(poi => {
            const marker = new google.maps.Marker({
                position: poi.location,
                map,
                title: `Marker ${poi.key}`,
            });
            marker.addListener('click', handleClick);
            return marker;
        });
        clusterer.current.addMarkers(markers);
    }, [props.pois, handleClick]);

    return null;
};

export default Mappa;
