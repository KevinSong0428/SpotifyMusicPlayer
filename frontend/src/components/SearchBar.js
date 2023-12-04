import React, { useState, useEffect } from "react";
import { styled, alpha, AppBar, Box, Toolbar, Typography, InputBase, Autocomplete, Grid, IconButton, Snackbar, Fade, Alert } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search"
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';


const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
        marginLeft: theme.spacing(3),
        width: "auto",
    },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    "& .MuiInputBase-input": {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "40ch",
        },
    },
    align: "center",
}));

// destructure props --> directly accessing onResultClick
export default function SearchBar({ code }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const renderSong = (props, song) => {
        return (
            < Box
                component="li"
                key={`${song.id}-option`}
                {...props}
                sx={{ display: 'flex', alignItems: 'center' }}
                onClick={() => handleSongClick(song)}
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

                <IconButton color="primary" onClick={(event) => handleAddToQueue(event, song)}>
                    <AddCircleOutlineOutlinedIcon />
                </IconButton>
            </Box >
        )
    };

    const getSearchResults = async () => {
        try {
            const apiUrl = `/spotify/search?q=${encodeURIComponent(searchQuery)}`
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
            console.log("SONGS: ", data);
        } catch (error) {
            console.error("Error fetching search results: ", error);
        }
    }

    const handleSearchInputChange = (event, newInputValue) => {
        setSearchQuery(newInputValue);
    };

    // live update on every change to the search query
    useEffect(() => {
        if (searchQuery && searchQuery.trim() != '') {
            console.log("Searching for: ", searchQuery)
            getSearchResults();
        } else {
            console.log("Emptying search results")
            setSearchResults([]);
        }

    }, [searchQuery])

    const handleSongClick = async (selectedSong) => {
        const apiUrl = `/spotify/play-selected-song?q=${encodeURIComponent(selectedSong.track_uri)}`
        await fetch(apiUrl);
    }

    const handleAddToQueue = async (event, song) => {
        event.stopPropagation(); // stop event propagation to prevent handleSongClick from being triggered
        console.log("ADDING TO QUEUE: ", song)
        try {
            // need to send POST request
            const requestOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            };
            await fetch(`/spotify/add-to-queue?q=${encodeURIComponent(song.track_uri)}`, requestOptions)
            setSnackbarOpen(true);
        } catch (err) {
            console.log("An error occured: ", err);
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography
                        variant="h4"
                        noWrap
                        component="div"
                        sx={{ display: { xs: "none", sm: "block" } }}
                    >
                        Spotify Room
                    </Typography>
                    <Typography
                        variant="h4"
                        noWrap
                        sx={{ display: { xs: "none", sm: "block" } }}>
                        Code: {code}
                    </Typography>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <Autocomplete
                            options={searchResults}
                            getOptionLabel={(song) => `${song.id}`}
                            // searchedResults will be rendered on search! This will makes autocomplete show UPDATED searchResults
                            filterOptions={(searchResults) => searchResults}
                            onInputChange={(event, newInputValue) => handleSearchInputChange(event, newInputValue)}
                            loading={searchResults.length === 0}
                            renderInput={(params) => (
                                <StyledInputBase
                                    {...params.InputProps}
                                    inputProps={params.inputProps}
                                    placeholder="Search..."
                                    sx={{ width: "40ch" }}
                                />
                            )}
                            renderOption={(props, song) => renderSong(props, song)}
                        />
                    </Search>
                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={3000}
                        onClose={() => setSnackbarOpen(false)}
                        TransitionComponent={Fade}
                        // message="Successfully added to queue."
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                            Successfully added to queue
                        </Alert>
                    </Snackbar>
                </Toolbar>
            </AppBar>
        </Box>
    )
}