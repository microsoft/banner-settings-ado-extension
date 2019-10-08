
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import "./common.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import * as SDK from "azure-devops-extension-sdk";

export async function showRootComponent(component: React.ReactElement<any>) {
    await SDK.init();
    await SDK.ready();

    ReactDOM.render(component, document.getElementById("root"));
}
