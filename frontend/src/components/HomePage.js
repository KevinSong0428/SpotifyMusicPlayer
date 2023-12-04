import React, { Component } from "react";
import RoomJoinPage from "./RoomJoinPage";
import CreateRoomPage from "./CreateRoomPage";
import Room from "./Room";
import { BrowserRouter as Router, Routes, Route, Link, Redirect, Navigate } from "react-router-dom"
import CreateRoomPageWrapper from "./CreateRoomPageWrapper";
import RoomJoinPageWrapper from "./RoomJoinPageWrapper";
import { Grid, Button, ButtonGroup, Typography, Box } from "@mui/material";

export default class HomePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomCode: null,
        }
        this.clearRoomCode = this.clearRoomCode.bind(this);
    }

    // lifecycle method to change behavior of this component
    // this is invoked immediately after a component is mounted, will fetch this api and see if there's a roomCode
    async componentDidMount() {
        // call endpoint on server
        const response = await fetch("/api/user-in-room");
        const data = await response.json();
        // data will be the json response so parse and look through it
        if (data.code) {
            this.setState({
                roomCode: data.code
            });
        }
    }


    renderHomePage() {
        return (
            <Grid container spacing={2} textAlign="center" style={{ minHeight: '100vh' }}>
                <Grid item xs={12}>
                    <Typography variant="h3" component="h3">
                        House Party
                    </Typography>
                </Grid>
                <Grid item xs={12} >
                    <Button
                        color="primary"
                        to="/join"
                        component={Link}
                        size="large"
                        variant="contained"
                    >
                        Join a Room
                    </Button>
                    <Button
                        color="secondary"
                        to="/create"
                        component={Link}
                        size="large"
                        variant="contained"
                    >
                        Create a Room
                    </Button>
                </Grid>
            </Grid>
        );
    };

    // // reset state of room code
    clearRoomCode() {
        console.log("Clearing room code: ", this.state.roomCode)
        this.setState({
            roomCode: null,
        });
        console.log("Cleared room code: ", this.state.roomCode)
    }

    render() {
        // return router to redirect to the right page
        return (
            <Router>
                <Routes>
                    {/* if we have roomCode, redirect to that url, else render home page */}
                    <Route path="/" element={(this.state.roomCode ? <Navigate to={`/room/${this.state.roomCode}`} /> : this.renderHomePage())} />
                    {/* <Route path="/" element={this.renderHomePage()} /> */}

                    {/* element={<this.renderHomePage /> */}
                    {/* needed to create a wrapper for component in order to use navigate function to redirect user after creating a new room and for joining a room! */}
                    <Route path='/join' element={<RoomJoinPageWrapper />} />
                    {/* <Route path='/create' element={<CreateRoomPage />} /> */}
                    <Route path='/create' element={<CreateRoomPageWrapper />} />
                    <Route path='/room/:roomCode' element={<Room leaveRoomCallback={() => this.clearRoomCode()} />} />
                    {/* <Route path='/room/:roomCode' render={(props) => (
                        <Room {...props} leaveRoomCallback={this.clearRoomCode} />
                    )} /> */}
                </Routes>
            </Router>
        );
    }
}