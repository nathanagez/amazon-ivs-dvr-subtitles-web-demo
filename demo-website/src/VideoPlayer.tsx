import React from 'react';
import videojs, {VideoJsPlayer} from 'video.js';
import 'video.js/dist/video-js.css';

export const VideoJS = (props: any) => {
    const videoRef = React.useRef(null);
    const playerRef = React.useRef<VideoJsPlayer | null>(null);
    const {options, onReady} = props;

    React.useEffect(() => {
        if (!playerRef.current) {
            const videoElement = videoRef.current;

            if (!videoElement) return;

            const player = playerRef.current = videojs(videoElement, options, () => {
                videojs.log('player is ready');
                onReady && onReady(player);
            });
        } else {
            const player = playerRef.current;
            player.src(options.sources)
            videojs.log('sources have changed\n', options.sources);
            player.addRemoteTextTrack(options.tracks[0], false)
            videojs.log('remote text track have been added\n', options.tracks);
        }
    }, [options, videoRef]);

    // Dispose the Video.js player when the functional component unmounts
    React.useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div data-vjs-player>
            <video ref={videoRef} className='video-js vjs-big-play-centered vjs-layout-small' />
        </div>
    );
}

export default VideoJS;
