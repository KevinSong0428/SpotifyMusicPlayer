import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button } from "@mui/material";
import CreateRoomPage from "./CreateRoomPage"
import MusicPlayer from "./MusicPlayer";
import SearchBar from "./SearchBar";

export default function Room(props) {
    const { roomCode } = useParams();
    const [votesToSkip, setVotesToSkip] = useState(2);
    const [guestCanPause, setGuestCanPause] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
    const [song, setSong] = useState({});
    const [queueSongs, setQueueSongs] = useState([])
    const navigate = useNavigate();

    // will run after component is first rendered
    useEffect(() => {
        // Fetch and update state based on the roomCode
        getRoomDetails();
    }, [roomCode]);

    // close/stop interval when component unmounts
    useEffect(() => {
        const getSong = setInterval(getCurrentSong, 10000) // <-- calling the function every second aka 1000
        const getQueue = setInterval(getQueueSongs, 10000) // <-- calling the function every second aka 1000
        return () => {
            clearInterval(getSong);
            clearInterval(getQueue);
        }
    }, [roomCode]);

    const getRoomDetails = () => {
        fetch("/api/get-room?code=" + roomCode)
            .then((response) => {
                console.log("get room details...")
                if (!response.ok) {
                    // if no response, clear roomCode and return back home
                    console.log("No reponse from api request for get room")
                    props.leaveRoomCallback();
                    navigate('/')
                    throw new Error("API request failedd");
                }
                return response.json()
            })
            .then((data) => {
                console.log("Received data from API:", data);
                setVotesToSkip(data.votes_to_skip);
                setGuestCanPause(data.guest_can_pause);
                setIsHost(data.is_host);
                console.log("isHost: ", data.is_host.toString())
                // need to authenticate user if user is host
                if (data.is_host) {
                    authenticateSpotify();
                }
            })
            .catch((error) => {
                console.log("An error occured: ", error);
            })
    };

    // ensure user is logged into spotify
    const authenticateSpotify = () => {
        console.log("Trying to authenticate spotify...")
        fetch("/spotify/is-authenticated")
            .then((response) => response.json())
            .then((data) => {
                setSpotifyAuthenticated(data.status)
                if (!data.status) {
                    fetch("/spotify/get-auth-url")
                        .then((response) => response.json())
                        .then((data) => {
                            // another way to redirect, native to js
                            window.location.replace(data.url);
                        })
                }
            })
    }

    const getCurrentSong = () => {
        fetch("/spotify/current-song")
            .then((response) => {
                if (!response.ok) {
                    return {};
                } else {
                    return response.json();
                }
            }).then((data) => {
                if (data && Object.keys(data).length > 0) {
                    setSong(data);
                    console.log(data);
                } else {
                    console.log("No song data currently available.");
                    setSong({});
                }
            }).catch((error) => {
                console.error("An error occurred fetching current song: ", error);
            })
    }

    const getQueueSongs = () => {
        fetch("/spotify/queue")
            .then((response) => response.json())
            .then(data => {
                setQueueSongs(data)
            })
            .catch((error) => {
                console.error("An error occured getting queued songs:", error)
            });
    }

    const leaveButtonPressed = async () => {
        try {
            // need to send POST request
            const requestOptions = {
                method: "POST",
                // saying that a json request is coming in
                headers: { "Content-Type": "application/json" }
            };
            await fetch("/api/leave-room", requestOptions);
            props.leaveRoomCallback();
            navigate('/')
        } catch (err) {
            console.log("An error occured: ", err);
        }
    }

    const updateShowSettings = (value) => {
        setShowSettings(value);
    }

    const renderSettingsButton = () => {
        return (
            <Grid>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => { updateShowSettings(true) }}
                >
                    Settings
                </Button>
            </Grid>
        );
    }

    const renderSettings = () => {
        return (
            <Grid container spacing={1}>
                <Grid item xs={12} align="center">
                    <CreateRoomPage
                        update
                        votesToSkip={votesToSkip}
                        guestCanPause={guestCanPause}
                        roomCode={roomCode}
                        // pass from parent component to call from CreateRoomPage component in order to update the Room component details
                        updateCallback={getRoomDetails}
                    // will need to render the updated details after changing

                    />
                </Grid>
                <Grid item xs={12} align="center">
                    {/* button to close the settings page --> change the settings to false to remove showing settings page */}
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => { updateShowSettings(false) }}
                    >
                        Close Settings
                    </Button>
                </Grid>
            </Grid>
        )
    }

    // if showing settings, we will render settings 
    if (showSettings) {
        return renderSettings();
    }

    return (
        <div>
            <SearchBar code={roomCode} />
            <Grid container spacing={1} alignItems="center" justifyContent="center" style={{ minHeight: '60vh' }}>
                <Grid item xs={12} align="center">
                </Grid>
                {/* spread song into musicplayer component as separate keys in props */}
                <MusicPlayer {...song} queueSongs={queueSongs} />
                <Grid item xs={12} align="center">
                    {/* {song} */}
                    {isHost ? renderSettingsButton() : null}
                </Grid>

                <Grid item xs={12} align="center">
                    <Button variant="contained" color="secondary" onClick={leaveButtonPressed}>
                        Leave Room
                    </Button>
                </Grid>
            </Grid>
        </div>

    );
}