import React from "react";
import { createRoot } from "react-dom/client";

import Home from "./examples/Home.js";

import "./styles/global.css";

createRoot(document.getElementById("root") as HTMLElement).render(<Home />);
