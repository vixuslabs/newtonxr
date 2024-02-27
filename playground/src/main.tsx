import React from "react";
import { createRoot } from "react-dom/client";

// import HandExample from "./examples/Hand.js";
import Home from "./examples/Home.js";

import "../styles/global.css";

const root = createRoot(document.getElementById("root")!);

// root.render(<HandExample />);
root.render(<Home />);
