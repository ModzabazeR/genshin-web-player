import React, { useEffect, useRef, useState } from 'react'
import useVideoPlayer from '../utils/useVideoPlayer'
import { FaPause, FaPlay, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'
import { BiFullscreen, BiExitFullscreen } from 'react-icons/bi'
import { MdSubtitles, MdHeadphones, MdCheck } from 'react-icons/md'
import { IoSettingsSharp } from 'react-icons/io5'
import { isMobile } from 'react-device-detect'
import { VideoDetails, VideoFormat } from '../typings'
import Loading from './Loading'
import formatTime from '../utils/globalUtils'
import Router from 'next/router'
const SubtitlesOctopus = require('libass-wasm')

interface VideoPlayerProps {
    videoSrc: VideoFormat[];
    subtitleList: { id: number, lang: string, url: string | null }[];
    audioList: { id: number, lang: string, url: string | null, timeshift: number }[];
    thumbnail: string;
    videoDetails: VideoDetails
}

const CustomVideoPlayer = ({ videoSrc, subtitleList, audioList, thumbnail, videoDetails }: VideoPlayerProps) => {
    const availableSubtitles = subtitleList.filter(sub => sub.url !== null)
    const availableAudios = audioList.filter(audio => audio.url !== null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const videoWrapperRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)
    const controlsRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<any>()
    const [instance, setInstance] = useState<any>()
    const [controlsOnHover, setControlsOnHover] = useState(false)
    const [isNoSubtitles, setIsNoSubtitles] = useState(availableSubtitles.length > 0 ? false : true)
    const [isLoading, setIsLoading] = useState(true)
    const {
        isPlaying,
        progress,
        isMuted,
        isFullScreen,
        showFirstPlayButton,
        showCursor,
        progressString,
        togglePlay,
        handleOnTimeUpdate,
        handleVideoProgress,
        toggleMute,
        toggleFullScreen,
        firstPlayClickHandler,
        setisPlaying,
        setShowCursor,
        setIsFullScreen,
    } = useVideoPlayer({ videoRef, videoWrapperRef, audioRef })

    const time = formatTime(Number(videoDetails.lengthSeconds))

    const audioHandler = (langId: number) => {
        setIsLoading(true)
        videoRef.current!.pause()
        audioRef.current!.src = audioList[langId].url!;
        audioRef.current!.load();
        audioRef.current!.onloadeddata = () => {
            setIsLoading(false)
            videoRef.current!.play();
            audioRef.current!.currentTime = videoRef.current!.currentTime + audioList[langId].timeshift;
        }
    }

    const qualityHandler = (url: string) => {
        setIsLoading(true)
        videoRef.current!.pause();
        audioRef.current!.pause();
        const time = progress;
        videoRef.current!.src = url;
        videoRef.current!.currentTime = time;
        videoRef.current!.load();
        videoRef.current!.onloadeddata = () => {
            setIsLoading(false)
            videoRef.current!.play();
        }
    }

    const controlsShowHandler = () => {
        clearTimeout(timerRef.current)
        controlsRef.current!.className = "controls opacity-100"
        setShowCursor(true)
        if (!controlsOnHover) {
            timerRef.current = setTimeout(() => {
                controlsRef.current!.className = "controls opacity-0"
                setShowCursor(false)
            }, 5000)
        }
    }

    useEffect(() => {
        const options = {
            video: videoRef.current,
            subUrl: subtitleList[8].url, // Thai
            fonts: ["https://modzabazer.github.io/multi-subtitle-and-audio-player/resources/fonts/browalia.ttc", "https://modzabazer.github.io/multi-subtitle-and-audio-player/resources/fonts/zh-cn.ttf"],
            workerUrl: "../subtitle-octopus/subtitles-octopus-worker.js",
            legacyWorkerUrl: "../subtitle-octopus/subtitles-octopus-worker-legacy.js",
        };
        setInstance(new SubtitlesOctopus(options));

        // videoSourceRef.current!.src = videoSrc[0].url; // Best Quality First
        audioRef.current!.src = audioList[2].url!; // Japanese
        audioRef.current!.load();

    }, [])

    const subtitleHandler = (langId: number) => {
        setIsNoSubtitles(false)
        const url = subtitleList[langId].url!;
        instance.setTrackByUrl(url);
    }



    const [activeSubtitle, setActiveSubtitle] = useState({
        activeSub: subtitleList[8],
        objects: availableSubtitles
    })

    const toggleSubtitle = (index: number) => {
        setActiveSubtitle({ ...activeSubtitle, activeSub: availableSubtitles[index] })
    }

    const checkIfSubtitleActive = (index: number) => {
        if (index === 999) {
            return true
        }
        return activeSubtitle.objects[index] === activeSubtitle.activeSub
    }

    const [activeAudio, setActiveAudio] = useState({
        activeAudio: audioList[2],
        objects: availableAudios
    })

    const toggleAudio = (index: number) => {
        setActiveAudio({ ...activeAudio, activeAudio: availableAudios[index] })
    }

    const checkIfAudioActive = (index: number) => {
        return activeAudio.objects[index] === activeAudio.activeAudio
    }

    const [activeQuality, setActiveQuality] = useState({
        activeQuality: videoSrc[0],
        objects: videoSrc
    })

    const toggleQuality = (index: number) => {
        setActiveQuality({ ...activeQuality, activeQuality: videoSrc[index] })
    }

    const checkIfQualityActive = (index: number) => {
        return activeQuality.objects[index] === activeQuality.activeQuality
    }

    useEffect(() => {
        videoRef.current!.onplay = () => {
            audioRef.current!.currentTime = videoRef.current!.currentTime + activeAudio.activeAudio.timeshift;
            setisPlaying(true)
            audioRef.current!.play();
        }
        videoRef.current!.onpause = () => {
            setisPlaying(false)
            audioRef.current!.pause();
        }
        videoRef.current!.onseeked = () => {
            audioRef.current!.currentTime = videoRef.current!.currentTime + activeAudio.activeAudio.timeshift;
        }
        videoRef.current!.onwaiting = () => {
            setIsLoading(true)
            audioRef.current!.pause();
        }
        videoRef.current!.onplaying = () => {
            setIsLoading(false)
            audioRef.current!.play();
        }
    }, [activeAudio])

    return (
        <>
            <div className="bg-black/30 my-8 cursor-pointer flex justify-center items-center" onClick={showFirstPlayButton ? firstPlayClickHandler : () => { }}>
                {
                    showFirstPlayButton && (
                        <FaPlay className='text-4xl md:text-5xl lg:text-6xl absolute' />
                    )
                }
                <div className={"video-wrapper w-full max-w-screen-md relative flex justify-center overflow-hidden items-center" + (showFirstPlayButton ? " -z-10" : "") + (showCursor ? " cursor-auto" : " cursor-none")} ref={videoWrapperRef} onMouseMove={controlsShowHandler}>
                    {
                        isLoading && !showFirstPlayButton && (
                        <div className='absolute z-50'>
                            <Loading />
                        </div>
                        )
                    }
                    <video
                        className="w-full"
                        preload='auto'
                        poster={thumbnail}
                        src={videoSrc[0].url}
                        ref={videoRef}
                        onTimeUpdate={handleOnTimeUpdate}
                        onClick={isMobile ? controlsShowHandler : togglePlay}
                        onError={(e) => {
                            const error = (e.target as HTMLVideoElement).error
                            console.log(e)
                            if (error!.code === 4) {
                                alert(`Video Error: Code ${error!.code} - Try reloading the page or change video quality`)
                            }
                        }}
                    >
                    </video>
                    <audio
                        ref={audioRef}
                        preload="auto"
                        onError={(e) => {
                            const error = (e.target as HTMLAudioElement).error
                            console.log(e)
                            if (error!.code === 4) {
                                alert(`Audio Error: Code ${error!.code} - If the video has no sound try reloading the page.`)
                                // Router.reload()
                            }
                        }}>
                    </audio>
                    <div className="controls opacity-0" ref={controlsRef} onMouseOver={() => { setControlsOnHover(true) }} onMouseLeave={() => { setControlsOnHover(false) }}>
                        <div className="relative h-[8.4px] mb-[10px] mx-2">
                            <progress value={progress} max={videoDetails.lengthSeconds}></progress>
                            <input
                                type="range"
                                min="0"
                                max={videoDetails.lengthSeconds}
                                value={progress}
                                onChange={(e) => handleVideoProgress(e)}
                                className="bg-white/20 rounded-lg absolute top-0 w-full"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <button className="cursor-pointer mx-2" onClick={togglePlay}>
                                    {
                                        isPlaying ? (
                                            <FaPause />
                                        ) : (
                                            <FaPlay />
                                        )
                                    }
                                </button>
                                <div className="text-sm md:text-base mx-2">
                                    {`${progressString.minutes}:${progressString.seconds}`}
                                    <span> / </span>
                                    {`${time.minutes}:${time.seconds}`}
                                </div>
                            </div>

                            <div>
                                <div className="cursor-pointer group inline-block relative mx-2">
                                    <MdSubtitles />
                                    <ul className={"absolute hidden text-white pt-1 group-hover:block bottom-0 my-5 text-xs md:text-sm w-max rounded-lg right-0 translate-x-10" + (availableSubtitles.length <= 3 ? "" : " overflow-hidden overflow-y-scroll h-24 md:h-32 lg:h-48")}>
                                        <li className={availableSubtitles.length > 1 ? "option-top" : "option-one"} onClick={() => {
                                            setIsNoSubtitles(true)
                                            instance.freeTrack();
                                        }}>{isNoSubtitles && <MdCheck className="inline mr-2" />}No Subtitle</li>
                                        {
                                            availableSubtitles.map((sub, index) => {
                                                return (<li key={index} className={(index === availableSubtitles.length - 1 ? "option-bottom" : "option-middle") + (checkIfSubtitleActive(index) ? " bg-black/70" : "")} onClick={() => {
                                                    subtitleHandler(sub.id)
                                                    toggleSubtitle(index)
                                                }}>{checkIfSubtitleActive(index) && <MdCheck className="inline mr-2" />}{sub.lang}</li>)

                                            })
                                        }
                                    </ul>
                                </div>

                                <div className="cursor-pointer group inline-block relative mx-2">
                                    <MdHeadphones />
                                    <ul className={"absolute hidden text-white pt-1 group-hover:block bottom-0 my-5 text-xs md:text-sm w-max rounded-lg right-0 translate-x-10" + (availableAudios.length <= 3 ? "" : " overflow-hidden overflow-y-scroll h-24 md:h-32 lg:h-36")}>
                                        {
                                            availableAudios.map((audio, index) => {
                                                return (<li key={index} className={(index === 0 ? "option-top" : index === availableAudios.length - 1 ? "option-bottom" : "option-middle")} onClick={() => {
                                                    audioHandler(audio.id)
                                                    toggleAudio(index)
                                                }}>{checkIfAudioActive(index) && <MdCheck className="inline mr-2" />}{audio.lang}</li>)
                                            })
                                        }
                                    </ul>
                                </div>

                                <button className="bg-none border-none outline-none cursor-pointer mx-2" onClick={toggleMute}>
                                    {
                                        isMuted ? (
                                            <FaVolumeMute />
                                        ) : (
                                            <FaVolumeUp />
                                        )
                                    }
                                </button>

                                <div className="cursor-pointer group inline-block relative mx-2">
                                    <IoSettingsSharp />
                                     <ul className={"absolute hidden text-white pt-1 group-hover:block bottom-0 right-0 my-5 text-xs md:text-sm w-max rounded-lg translate-x-10" + (videoSrc.length <= 3 ? "" : " overflow-hidden overflow-y-scroll h-24 md:h-32 lg:h-36")}>
                                        {
                                            videoSrc.map((src, index) => {
                                                return (<li key={index} className={(index === 0 ? "option-top" : index === videoSrc.length - 1 ? "option-bottom" : "option-middle")} onClick={() => {
                                                    qualityHandler(src.url)
                                                    toggleQuality(index)
                                                }}>{checkIfQualityActive(index) && <MdCheck className="inline mr-2" />}{src.qualityLabel}</li>
                                                )
                                            })
                                        }
                                     </ul>
                                </div>

                                <button onClick={toggleFullScreen} className="mx-2">
                                    {
                                        isFullScreen ? (
                                            <BiExitFullscreen />
                                        ) : (
                                            <BiFullscreen />
                                        )
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CustomVideoPlayer