// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from "react";

import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";

import { Level } from "../models/global-message-banners";

interface ILevelDropdownProps {
    level: Level;
    onChange?(level: Level): void;
}

export class LevelDropdown extends React.Component<ILevelDropdownProps, {}> {
    private readonly levelList: IListBoxItem[];
    private readonly levelSelection = new DropdownSelection();

    constructor(props: ILevelDropdownProps) {
        super(props);

        const levelEnumObject = Object.keys(Level);
        this.levelList = levelEnumObject.slice(levelEnumObject.length / 2).map((value, key) => ({
            id: `${key}`,
            text: value,
            iconProps: { iconName: value },
        }));

        this.levelSelection.select(this.props.level);
    }

    public componentDidUpdate(prevProps: ILevelDropdownProps): void {
        if (prevProps.level !== this.props.level) {
            this.levelSelection.select(this.props.level);
        }
    }

    public render(): JSX.Element {
        return (
            <Dropdown
                items={this.levelList}
                selection={this.levelSelection}
                onSelect={(event, item) => {
                    if (this.props.onChange != null) {
                        this.props.onChange(+item.id);
                    }
                }}
            />
        );
    }
}
