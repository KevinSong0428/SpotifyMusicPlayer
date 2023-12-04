import React, { Component } from "react";
import { Button, Grid, Typography, TextField, FormHelperText, FormControl, Radio, RadioGroup, FormControlLabel, Alert } from '@mui/material';
import { Link } from "react-router-dom"
import { Collapse } from "@mui/material"


class CreateRoomPage extends Component {
    static defaultProps = {
        votesToSkip: 2,
        guestCanPause: true,
        update: false,
        roomCode: null,
        updateCallback: () => { },
    }

    constructor(props) {
        super(props);

        this.state = {
            guestCanPause: this.props.guestCanPause,
            votesToSkip: this.props.votesToSkip,
            errorMessage: "",
            successMessage: "",
        };

        // bind functions to the THIS keyword in order to be able to use function
        this.handleRoomCreate = this.handleRoomCreate.bind(this);
        this.handleVotesChange = this.handleVotesChange.bind(this);
        this.handleGuestCanPauseChange = this.handleGuestCanPauseChange.bind(this);
        this.handleUpdateButtonPressed = this.handleUpdateButtonPressed.bind(this);
    }

    handleVotesChange(e) {
        this.setState({
            votesToSkip: e.target.value,
        });
    }

    handleGuestCanPauseChange(e) {
        this.setState({
            // if value is equal to true, set true, else false
            guestCanPause: e.target.value === "true" ? true : false,
        });
    }

    // need to send this to the backend and actually create a new room with the information here
    async handleRoomCreate() {
        const requestOptions = {
            method: "POST",
            // saying that a json request is coming in
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                votes_to_skip: this.state.votesToSkip,
                guest_can_pause: this.state.guestCanPause
            })
        };

        try {
            const response = await fetch("/api/create-room", requestOptions);
            if (!response.ok) {
                throw new Error("Failed to create a room.")
            }

            const data = await response.json();
            // Use the navigate function to redirect to the new route
            this.props.navigate("/room/" + data.code);
        } catch (err) {
            console.log("Error creating a room: ", err);
        }
    }

    async handleUpdateButtonPressed() {
        const requestOptions = {
            method: "PATCH", // send patch request to hit that patch function in api
            // saying that a json request is coming in
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                votes_to_skip: this.state.votesToSkip,
                guest_can_pause: this.state.guestCanPause,
                code: this.props.roomCode,
            })
        };

        try {
            const response = await fetch("/api/update-room", requestOptions);
            if (response.ok) {
                this.setState({
                    successMessage: "Room updated successfully!"
                }, () => {
                    this.props.updateCallback()
                });
                // const data = await response.json();
                // Use the navigate function to redirect to the new route
                // this.props.navigate("/room/" + data.code);
            } else {
                console.log(response)
                this.setState({
                    errorMessage: "Room failed to update."
                });
            }

        } catch (err) {
            console.log("Error creating a room: ", err);
        }
    }

    renderCreateButtons() {
        return (
            // need to return a contained grid if multiple items in grid
            <Grid container spaceing={1} align="center">
                <Grid item xs={12} >
                    <Button color="primary" variant="contained" onClick={this.handleRoomCreate}>
                        Create A Room
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    <Button color="secondary" variant="contained" to="/" component={Link}>
                        Back
                    </Button>
                </Grid>
            </Grid >
        )
    }

    renderUpdateButtons() {
        return (
            // can return just a single grid item without putting it in a container
            <Grid item xs={12} align="center">
                <Button
                    color="primary"
                    variant="contained"
                    onClick={this.handleUpdateButtonPressed}
                >
                    Update Room
                </Button>
            </Grid>
        )
    }


    render() {
        const title = this.props.update ? "Update Room" : "Create a Room"

        return (
            <Grid container spacing={1} style={{ minHeight: '75vh' }}>
                <Grid item xs={12} align="center">
                    <Collapse in={this.state.errorMessage !== "" || this.state.successMessage !== ""}>
                        {this.state.successMessage && (
                            <Alert severity="success" onClose={() => {
                                this.setState({
                                    successMessage: ""
                                });
                            }}>{this.state.successMessage}</Alert>
                            // <Typography variant="body1" color="primary">
                            //     {this.state.successMessage}
                            // </Typography>
                        )}
                        {this.state.errorMessage && (
                            // <Typography variant="body1" color="error">
                            //     {this.state.errorMessage}
                            // </Typography>
                            <Alert severity="error" onClose={() => {
                                this.setState({
                                    errorMessage: ""
                                });
                            }}>{this.state.errorMessage}</Alert>
                        )}
                    </Collapse>
                </Grid>


                <Grid item xs={12} align="center">
                    <Typography component="h4" variant="h4">
                        {title}
                    </Typography>
                </Grid>

                <Grid item xs={12} align="center">
                    <FormControl component="fieldset">
                        <FormHelperText>
                            <div align="center">Guest Control Playback State</div>
                        </FormHelperText>
                        <RadioGroup
                            row
                            defaultValue={this.props.guestCanPause.toString()}
                            onChange={this.handleGuestCanPauseChange}
                        >
                            <FormControlLabel
                                value="true"
                                control={<Radio color="primary" />}
                                label="Play/Pause"
                                labelPlacement="bottom"
                            />
                            <FormControlLabel
                                value="false"
                                control={<Radio color="secondary" />}
                                label="No Control"
                                labelPlacement="bottom"
                            />
                        </RadioGroup>
                    </FormControl>
                </Grid>

                <Grid item xs={12} align="center">
                    <FormControl>
                        <TextField
                            required={true}
                            type="number"
                            defaultValue={this.state.votesToSkip}
                            // inputProps accepts object
                            inputProps={{
                                min: 1,
                                style: { textAlign: "center" },
                            }}
                            onChange={this.handleVotesChange}
                        />
                        <FormHelperText>
                            <div align="center">
                                Votes Required to Skip
                            </div>
                        </FormHelperText>
                    </FormControl>
                </Grid>
                {this.props.update ? this.renderUpdateButtons() : this.renderCreateButtons()}
            </Grid>
        )
    }
}

export default CreateRoomPage;