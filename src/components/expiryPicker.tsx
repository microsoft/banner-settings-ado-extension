// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import "./expiryPicker.scss";

import * as React from "react";

import * as moment from "moment";
import * as mask from "text-mask-core";

import { Checkbox } from "azure-devops-ui/Checkbox";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField } from "azure-devops-ui/TextField";

interface IExpiryPickerProps {
    expiryDate: Date;
    onChange?(date: Date): void;
    onParseError?(message: string): void;
}

interface IExpiryPickerState {
    expiryEnabled: boolean;
    dateError: boolean;
}

export class ExpiryPicker extends React.Component<IExpiryPickerProps, IExpiryPickerState> {
    private textMaskInputElement: any;
    private dateStringObservable: ObservableValue<string> = new ObservableValue<string>("");

    constructor(props: IExpiryPickerProps) {
        super(props);

        this.state = {
            expiryEnabled: props.expiryDate != null,
            dateError: false,
        };
    }

    public componentDidMount(): void {
        this.setupFields();
    }

    public componentDidUpdate(prevProps: IExpiryPickerProps): void {
        if (
            (prevProps.expiryDate && prevProps.expiryDate.getTime())
            !== (this.props.expiryDate && this.props.expiryDate.getTime())
        ) {
            this.setupFields();
        }
    }

    public render(): JSX.Element {
        return (
            <div className="expiry-picker-container">
                <FormItem label="Expiry">
                    <Checkbox
                        label="Set to expire"
                        checked={this.state.expiryEnabled}
                        onChange={(event, checked) => {
                            this.setState({ expiryEnabled: checked });

                            if (!checked && this.props.onChange != null) {
                                this.props.onChange(null);
                            } else if (checked && this.props.onParseError != null) {
                                this.props.onParseError("Add expiry date");
                            }
                        }}
                    />
                </FormItem>
                <FormItem label="Expiry time (local time)" error={this.state.expiryEnabled && this.state.dateError}>
                    <TextField
                        className="expiry-field"
                        disabled={!this.state.expiryEnabled}
                        value={this.dateStringObservable}
                        placeholder="mm/dd/yyyy hh:mm"
                        ref={(ref) => {
                            if (ref != null && this.textMaskInputElement == null) {
                                this.textMaskInputElement = mask.createTextMaskInputElement({
                                    // tslint:disable-next-line:max-line-length
                                    mask: [/[0-1]/, /\d/, "/", /[0-3]/, /\d/, "/", /\d/, /\d/, /\d/, /\d/, " ", /[0-2]/, /\d/, ":", /[0-5]/, /\d/],
                                    inputElement: ref.inputElement.current,
                                });
                            }
                        }}
                        onChange={(event, value) => {
                            if (this.textMaskInputElement != null) {
                                this.textMaskInputElement.update(value.replace("_", ""));
                            }

                            const dateString = event.target.value;
                            this.dateStringObservable.value = dateString;

                            const newMoment = moment(dateString, "MM/DD/YYYY HH:mm", true);

                            if (newMoment.isValid()) {
                                if (newMoment.isBefore(moment.now())) {
                                    // Date before now
                                    this.setState({ dateError: true });
                                    if (this.props.onParseError != null) {
                                        this.props.onParseError("The expiration is in the past");
                                    }
                                } else {
                                    if (this.props.onChange != null) {
                                        this.props.onChange(newMoment.toDate());
                                    }

                                    this.setState({ dateError: false });
                                }
                            } else {
                                // Date Invalid
                                this.setState({ dateError: true });
                                if (this.props.onParseError != null) {
                                    this.props.onParseError("The expiration is invalid");
                                }
                            }
                        }}
                    />
                </FormItem>
            </div>
        );
    }

    private setupFields(): void {
        const dateString = this.props.expiryDate == null
            ? "" : moment(this.props.expiryDate).format("MM/DD/YYYY HH:mm");

        this.dateStringObservable.value = dateString;
    }
}
