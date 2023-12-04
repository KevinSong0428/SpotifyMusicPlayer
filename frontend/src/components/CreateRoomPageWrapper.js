import React from "react";
import CreateRoomPage from "./CreateRoomPage";
import { useNavigate } from "react-router-dom";

function CreateRoomPageWrapper() {
    const navigate = useNavigate();

    return <CreateRoomPage navigate={navigate} />;
}

export default CreateRoomPageWrapper;