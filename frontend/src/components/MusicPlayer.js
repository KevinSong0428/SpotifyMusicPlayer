import React, { Component, useState } from "react";
import { Grid, Typography, Card, IconButton, LinearProgress, Collapse, Box } from "@mui/material"
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';

export default function MusicPlayer(props) {
    const { queueSongs } = props;
    const [queueVisible, setQueueVisible] = useState(false);

    const songProgress = (props.time / props.duration) * 100;

    const pauseSong = () => {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
        };
        fetch("/spotify/pause", requestOptions);
    }

    const playSong = () => {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
        };
        fetch("/spotify/play", requestOptions);
    }

    const skipSong = () => {
        console.log(props)
        console.log(props.votes, props.votes_required)
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        };
        fetch("/spotify/skip", requestOptions);
    }

    const toggleQueue = () => {
        setQueueVisible(!queueVisible);
    }

    const renderQueue = () => {
        return (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <ul>
                    {queueSongs.map((song) => (
                        <Box
                            component="li"
                            key={`${song.id}`}
                            // {...props}
                            sx={{ display: 'flex', alignItems: 'center', padding: '8px', borderBottom: '1px solid #ccc' }}
                        >
                            <img
                                src={song.image_url}
                                alt={song.title}
                                style={{ marginRight: '8px', width: '50px', height: '50px' }}
                            />
                            <Grid container direction="column" style={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1">{song.title}</Typography>
                                <Typography variant="body2" color="textSecondary">{song.artist}</Typography>
                            </Grid>
                            <Grid>
                                <Typography variant="body2" color="textSecondary">{song.length}</Typography>
                            </Grid>
                        </Box>
                    ))}
                </ul>
            </div>
        )
    }

    const renderEmptyQueue = () => {
        return (
            <Typography>
                No Songs Queued!
            </Typography>
        )
    }

    return (
        <div>
            <Card>
                <Grid container alignItems="center" style={{ position: 'relative' }}>
                    {/* 1/3 of the width of grid */}
                    <Grid item align="center" xs={4}>
                        <img src={props.image_url} height="100%" width="100%" />
                    </Grid>
                    {/* 2/3 of the width of grid */}
                    <Grid item align="center" xs={8}>
                        <Typography component="h5" variant="h5">{props.title}</Typography>
                        <Typography color="textSecondary" variant="subtitle1">{props.artist}</Typography>
                        <div>
                            <IconButton
                                onClick={() => {
                                    if (props.is_playing !== undefined && props.is_playing !== null) {
                                        props.is_playing ? pauseSong() : playSong()
                                    }
                                }}
                            >
                                {props.is_playing ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>

                            <IconButton onClick={() => skipSong()}>
                                <SkipNextIcon />
                            </IconButton>
                            <IconButton onClick={toggleQueue}>
                                <QueueMusicIcon />
                            </IconButton>
                            <Typography color="textSecondary" variant="subtitle2">
                                Votes needed to skip: {props.votes} / {props.votes_required}
                            </Typography>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                            <Typography color="textSecondary" variant="body2">
                                {props.converted_progress} / {props.converted_duration}
                            </Typography>
                        </div>
                    </Grid>
                </Grid>
                <LinearProgress variant="determinate" value={songProgress} />
            </Card>
            <Collapse in={queueVisible}>
                <Card>
                    <Typography variant="body1">
                        Queue
                    </Typography>
                    {queueSongs.length > 0 ? renderQueue() : renderEmptyQueue()}
                </Card>
            </Collapse>
        </div>
    )
}