import React, { Component } from "react";
import { TextField, Button, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export default class RoomJoinPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomCode: "",
            error: ""
        };
        this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
        this.roomButtonPressed = this.roomButtonPressed.bind(this);
        this.keyPress = this.keyPress.bind(this);
    }

    handleTextFieldChange(e) {
        this.setState({
            roomCode: e.target.value
        });
    }

    roomButtonPressed() {
        console.log("Joined room: ", this.state.roomCode)
        const requestOptions = {
            method: "POST",
            // saying that a json request is coming in
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: this.state.roomCode,
            })
        };
        fetch("/api/join-room", requestOptions).then((response) => {
            if (response.ok) {
                this.props.navigate(`/room/${this.state.roomCode}`);
            } else {
                this.setState({
                    error: "Room not found."
                })
            }
        }).catch((error) => {
            console.log(error);
        })
    }

    // handle submit with Enter key
    keyPress(e) {
        if (e.keyCode == 13) {
            this.roomButtonPressed();
        }
    }

    render() {
        return (
            <Grid container spacing={1} align="center" style={{ minHeight: '50vh' }}>
                <Grid item xs={12}>
                    <Typography variant="h4" component="h4">
                        Join a Room
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        error={this.state.error}
                        label="Code"
                        placeholder="Enter a Room Code: "
                        value={this.state.roomCode}
                        helperText={this.state.error}
                        variant="outlined"
                        onChange={this.handleTextFieldChange}
                        onKeyDown={this.keyPress}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={this.roomButtonPressed}>
                        Enter
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" color="secondary" to="/" component={Link}>
                        Back
                    </Button>
                </Grid>
            </Grid>
        )
    }


}