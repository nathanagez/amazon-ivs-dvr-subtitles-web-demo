import React, {useRef, useState} from 'react';

// This imports the functional component from the previous sample.
import VideoPlayer from './VideoPlayer'
import videojs, {VideoJsPlayer, VideoJsPlayerOptions} from "video.js";

const App = () => {
    const playerRef = useRef<VideoJsPlayer | null>(null);
    const playbackUrlRef = useRef<HTMLInputElement>(null);
    const textTrackUrl = useRef<HTMLInputElement>(null);
    const [videoJsOptions, setVideoJsOptions] = useState<VideoJsPlayerOptions>({
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: false,
        width: 1280,
        height: 720
    })
    const handlePlayerReady = (player: VideoJsPlayer) => {
        playerRef.current = player;

        // You can handle player events here, for example:
        player.on('waiting', () => {
            videojs.log('player is waiting');
        });

        player.on('dispose', () => {
            videojs.log('player will dispose');
        });
    };

    const applyChanges = () => {
        setVideoJsOptions({
            ...videoJsOptions,
            sources: [{
                src: playbackUrlRef.current!.value,
                type: 'application/x-mpegURL'
            }],
            tracks: [{
                src: textTrackUrl.current!.value,
                kind: 'subtitles',
                srclang: 'en',
                default: true,
                label: 'EN'
            }]
        })
    }

    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <p>
                <label>Playback url: </label>
                <input type="text" placeholder="Playback url" ref={playbackUrlRef}/>
            </p>
            <p>
                <label>Text Track url: </label>
                <input type="text" placeholder="Text track url" ref={textTrackUrl}/>
            </p>
            <p>
                <button onClick={applyChanges}>Apply</button>
            </p>
            <VideoPlayer options={{...videoJsOptions}} onReady={handlePlayerReady}/>
        </div>
    );
}

export default App;
