import React from "react";
import RoomJoinPage from "./RoomJoinPage";
import { useNavigate } from "react-router-dom";

function RoomJoinPageWrapper() {
    const navigate = useNavigate();

    return <RoomJoinPage navigate={navigate} />;
}

export default RoomJoinPageWrapper;