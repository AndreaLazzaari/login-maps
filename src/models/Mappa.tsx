import React from 'react';
import { createRoot } from "react-dom/client";
import { APIProvider, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';

const Mappa: React.FC = () => {



    return (
        <>
            <div id='mappa'>
                <APIProvider apiKey={'Your API key here'} onLoad={() => console.log('Maps API has loaded.')}>
                    <Map
                        defaultZoom={13}
                        defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
                        onCameraChanged={(ev: MapCameraChangedEvent) =>
                            console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
                        }>
                    </Map>
                </APIProvider>
            </div>
        </>
    )

};

// const root = createRoot(document.getElementById('mappa') as HTMLElement);
// root.render(<Mappa />);


export default Mappa;







