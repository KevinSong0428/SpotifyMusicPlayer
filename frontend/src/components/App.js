import React, { Component } from "react"
import { render } from "react-dom"
import HomePage from "./HomePage";

// Class component - React
// export default class App extends Component {
//     constructor(props) {
//         super(props);
//     }

//     render() {
//         return (<div className="center">
//             <HomePage />
//         </div>
//         );
//     }
// }

// Function component - React
export default function App() {
    return (<div className="center">
        <HomePage />
    </div>
    );
}

// const appDiv = document.getElementById("app");
// render(<App />, appDiv);


// get the app element and then render this component into the div
const appDiv = document.getElementById("app");
// render app component into appDiv into index.html file
render(<App />, appDiv)

