import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import Ampify from "aws-amplify";
import "@aws-amplify/ui/dist/style.css";
import aws_exports from "./aws-exports";

Ampify.configure(aws_exports);

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById("root"),
);
