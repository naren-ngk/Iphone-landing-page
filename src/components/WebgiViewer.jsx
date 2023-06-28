import { useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';

import {
    ViewerApp,
    AssetManagerPlugin,
    GBufferPlugin,
    ProgressivePlugin,
    TonemapPlugin,
    SSRPlugin,
    SSAOPlugin,
    BloomPlugin,
    GammaCorrectionPlugin,
} from "webgi";

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollAnimation } from '../lib/scroll-animation';

gsap.registerPlugin(ScrollTrigger);

const WebgiViewer = forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const [viewerRef, setViewerRef] = useState(null);
    const [targeterRef, setTargeterRef] = useState(null);
    const [cameraRef, setCameraRef] = useState(null);
    const [positionRef, setPositionRef] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const canvasContainerRef = useRef(null);

    useImperativeHandle(ref, () => ({
        triggerPreview() {
            setPreviewMode(true);
            props.contentRef.current.style.opacity = '0';
            canvasContainerRef.current.style.pointerEvents = 'all';

            gsap.to(positionRef, {
                x: 13.04,
                y: -2.01,
                z: 2.29,
                duration: 2,
                onUpdate: () => {
                    viewerRef.setDirty();
                    cameraRef.positionTargetUpdated(true)
                }
            });
            gsap.to(targeterRef, {
                x: 0.11,
                y: 0.0,
                z: 0.0,
                duration: 2
            })

            viewerRef.scene.activeCamera.setCameraOptions({ controlsEnabled: true })
        }
    }))

    const memorizedScroll = useCallback(
        (position, target, onUpdate) => {
            if (position && target && onUpdate) {
                scrollAnimation(position, target, onUpdate);
            }
        }, []
    );

    const setupViewer = useCallback(async () => {
        const viewer = new ViewerApp({
            canvas: canvasRef.current,
        });

        setViewerRef(viewer);

        const manager = await viewer.addPlugin(AssetManagerPlugin);

        const camera = viewer.scene.activeCamera;
        const position = camera.position;
        const target = camera.target;

        setCameraRef(camera);
        setPositionRef(position);
        setTargeterRef(target);

        await viewer.addPlugin(GBufferPlugin);
        await viewer.addPlugin(new ProgressivePlugin(32));
        await viewer.addPlugin(new TonemapPlugin(true));
        await viewer.addPlugin(GammaCorrectionPlugin);
        await viewer.addPlugin(SSRPlugin);
        await viewer.addPlugin(SSAOPlugin);
        await viewer.addPlugin(BloomPlugin);

        viewer.renderer.refreshPipeline();
        await manager.addFromPath("scene-black.glb");
        viewer.getPlugin(TonemapPlugin).config.clipBackground = true;
        viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });
        window.scrollTo(0, 0);

        let needsUpdate = true;

        const onUpdate = () => {
            needsUpdate = true;
            viewer.setDirty();
        }

        viewer.addEventListener('preFrame', () => {
            if (needsUpdate) {
                camera.positionTargetUpdated(true);
                needsUpdate = false;
            }
        });

        memorizedScroll(position, target, onUpdate);

    }, []);

    useEffect(() => { setupViewer() }, []);

    const handleExit = useCallback(() => {
        props.contentRef.current.style.opacity = '1';
        canvasContainerRef.current.style.pointerEvents = 'none';
        viewerRef.scene.activeCamera.setCameraOptions({ controlsEnabled: false });
        setPreviewMode(false);

        gsap.to(positionRef, {
            x: 1.56,
            y: 5.0,
            z: 0.01,
            scrollTrigger: {
                trigger: '.display-section',
                start: 'top bottom',
                end: 'top top',
                scrub: 2,
                immediateRender: false
            },
            onUpdate: () => {
                viewerRef.setDirty();
                cameraRef.positionTargetUpdated(true);
            }
        });
        gasp.to(targeterRef, {
            x: -0.55,
            y: 0.32,
            z: 0,
            scrollTrigger: {
                trigger: '.display-section',
                start: 'top bottom',
                end: 'top top',
                scrub: 2,
                immediateRender: false
            },
        })

    }, [canvasContainerRef, viewerRef, positionRef, cameraRef, targeterRef]);

    return (
        <div id='webgi-canvas-container' ref={canvasContainerRef}>
            <canvas id='webgi-canvas' ref={canvasRef} />
            {previewMode && (
                <button className='button' onClick={handleExit}>Exit</button>
            )}
        </div>
    );
})

export default WebgiViewer;