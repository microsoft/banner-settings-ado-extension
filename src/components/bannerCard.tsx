// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import "./bannerCard.scss";

import * as React from "react";

import * as moment from "moment";

import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Card } from "azure-devops-ui/Card";
import { FormItem } from "azure-devops-ui/FormItem";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { TextField, TextFieldStyle } from "azure-devops-ui/TextField";
import { Tooltip } from "azure-devops-ui/TooltipEx";

import { GlobalMessageBanner, Level } from "../models/global-message-banners";
import { VstsService } from "../services/vsts-service";
import { ExpiryPicker } from "./expiryPicker";
import { LevelDropdown } from "./levelDropdown";

interface IBannerCardProps {
    banner: GlobalMessageBanner;
    onSave(banner: GlobalMessageBanner): void;
    onDelete(): void;
}

interface IBannerCardState extends Partial<GlobalMessageBanner> {
    dirty: boolean;
    loading: boolean;
    expanded: boolean;
    expiryErrorText?: string;
    messageErrorText?: string;
}

export class BannerCard extends React.Component<IBannerCardProps, IBannerCardState> {
    constructor(props: IBannerCardProps) {
        super(props);

        this.state = {
            level: this.props.banner.level,
            expirationDate: this.props.banner.expirationDate,
            message: this.props.banner.message,
            dirty: false,
            loading: false,
            expanded: false,
        };
    }

    public componentDidMount(): void {
        this.setupFields();
    }

    public componentDidUpdate(prevProps: IBannerCardProps): void {
        if (JSON.stringify(prevProps.banner) !== JSON.stringify(this.props.banner)) {
            this.setupFields();
        }
    }

    public render(): JSX.Element {
        const statusProps = this.getStatusProps();

        return (
            <Card className="banner-card">
                <div className="banner-item">
                    <div className="banner-header">
                        <Tooltip text={statusProps.text}>
                            <div>
                                <Status
                                    {...statusProps}
                                    text={this.errorText}
                                    size={StatusSize.l}
                                />
                            </div>
                        </Tooltip>
                        <FormItem className="header-message">
                            <TextField
                                prefixIconProps={{ iconName: Level[this.state.level] }}
                                value={this.state.message}
                                onChange={(e, newValue) => {

                                    this.setState({
                                        message: newValue,
                                        messageErrorText: this.getMessageError(newValue),
                                    });
                                    this.ensureMarkedDirty();
                                }}
                                placeholder="Message"
                                style={TextFieldStyle.inline}
                            />
                        </FormItem>
                        <ButtonGroup className="header-buttons">
                            <Button
                                iconProps={{ iconName: "Edit" }}
                                text={this.state.expanded === true ? "Edit less" : "Edit more"}
                                onClick={() => {
                                    this.setState({ expanded: !this.state.expanded });
                                }}
                            />
                            <Button
                                iconProps={{ iconName: "Save" }}
                                primary={true}
                                disabled={!this.isSaveEnabled()}
                                onClick={() => this.saveBanner()}
                                tooltipProps={{ text: "Save" }}
                            />
                            <Button
                                iconProps={{ iconName: "Delete" }}
                                danger={true}
                                onClick={() => this.deleteBanner()}
                                tooltipProps={{ text: "Delete" }}
                            />
                        </ButtonGroup>
                    </div>
                    {this.state.expanded === true ? <div className="banner-body">
                        <FormItem label="Level" className="level-dropdown">
                            <LevelDropdown
                                level={this.state.level}
                                onChange={(level) => {
                                    this.setState({ level });
                                    this.ensureMarkedDirty();
                                }}
                            />
                        </FormItem>
                        <ExpiryPicker
                            expiryDate={this.state.expirationDate}
                            onChange={(expirationDate) => {
                                this.setState({ expirationDate, expiryErrorText: null });
                                this.ensureMarkedDirty();
                            }}
                            onParseError={(errorMessage) => {
                                this.setState({ expiryErrorText: errorMessage });
                            }}
                        />
                    </div> : null}
                </div>
            </Card>
        );
    }

    private getMessageError(message: string): string {
        if (message.split(" ").length >= 30) {
            return "Message too long";
        }

        return null;
    }

    private async saveBanner(): Promise<void> {
        this.setState({ loading: true });

        const banner = this.props.banner;
        banner.message = this.state.message;
        banner.level = this.state.level;
        banner.expirationDate = this.state.expirationDate;

        try {
            await VstsService.instance.saveWebGlobalMessageBanner(banner);

            this.props.onSave(banner);

            this.setState({ dirty: false, loading: false });

            this.isSaveEnabled();
        } catch (ex) {
            this.setState({ messageErrorText: "Unable to save" });
        }

    }

    private async deleteBanner(): Promise<void> {
        try {
            await VstsService.instance.deleteWebGlobalMessageBanner(this.props.banner);

            this.props.onDelete();
        } catch (ex) {
            this.setState({ messageErrorText: "Unable to delete" });
        }
    }

    private isSaveEnabled(): boolean {
        return this.state.dirty
            && this.errorText == null
            && !this.isMessageExpired();
    }

    private ensureMarkedDirty(): void {
        if (this.state.dirty === false) {
            this.setState({ dirty: true });
        }
    }

    private isMessageExpired(): boolean {
        return this.state.expirationDate != null && (this.state.expirationDate < new Date());
    }

    private setupFields(): void {
        if (this.props.banner == null) {
            return;
        }

        this.setState(this.props.banner);
    }

    private getStatusProps(): IStatusProps {
        if (this.errorText != null) {
            return {
                ...Statuses.Failed,
                text: this.errorText,
            };
        }

        if (!this.state.dirty) {
            if (this.state.expirationDate == null) {
                return {
                    ...Statuses.Success,
                    text: "This message will be shown indefinitely.",
                };
            } else {
                const dateMoment = moment(this.state.expirationDate);
                if (dateMoment.isBefore(moment.now())) {
                    return {
                        ...Statuses.Warning,
                        // tslint:disable-next-line:max-line-length
                        text: `This message was shown until ${dateMoment.calendar().toLocaleLowerCase()}. Change the expiration date to show again.`,
                    };
                } else {
                    return {
                        ...Statuses.Success,
                        text: `This message will be shown until ${dateMoment.calendar().toLocaleLowerCase()}.`,
                    };
                }
            }
        } else {
            return {
                ...Statuses.Warning,
                text: "The shown message is out of date. Save your changes.",
            };
        }
    }

    private get errorText(): string {
        return this.state.messageErrorText == null ? this.state.expiryErrorText : this.state.messageErrorText;
    }
}
