// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import "./hub.scss";
import "azure-devops-ui/Core/override.css";

import * as React from "react";

import { CommonServiceIds, IHostPageLayoutService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";

import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Page } from "azure-devops-ui/Page";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ZeroData, ZeroDataActionType } from "azure-devops-ui/ZeroData";

import { showRootComponent } from "./common/common";
import { BannerCard } from "./components/bannerCard";
import { GlobalMessageBanner } from "./models/global-message-banners";
import AdoService from "./services/ado-service";

interface IHubComponentState {
    banners: GlobalMessageBanner[];
    loading: boolean;
    errorText: string;
}

class HubComponent extends React.Component<object, IHubComponentState> {
    public readonly levelList: IListBoxItem[];

    constructor(props: object) {
        super(props);

        this.state = {
            banners: [],
            loading: false,
            errorText: null,
        };
    }

    public async componentDidMount(): Promise<void> {
        this.setState({ loading: true });

        try {
            const banners = await AdoService.getWebGlobalMessageBanners();
            this.setState({ banners, loading: false });
        } catch (ex) {
            this.setState({ loading: false, errorText: `There was an error loading the banners: ${ex.message}` });
        }
    }

    public render(): JSX.Element {
        return (
            <Page className="container flex-grow">
                <Header
                    title="Banner Settings"
                    commandBarItems={this.getCommandBarItems()}
                    titleSize={TitleSize.Large}
                />
                {
                    this.state.errorText == null ? null :
                        <MessageCard
                            className="error-message-card"
                            onDismiss={() => this.setState({ errorText: null })}
                            severity={MessageCardSeverity.Error}
                        >
                            {this.state.errorText}
                        </MessageCard>
                }
                {this.state.banners != null && this.state.banners.length !== 0
                    ? (
                        <div className="items-container">
                            <div className="banner-items">
                                {this.state.banners.map((banner, index) => (
                                    <BannerCard
                                        key={index}
                                        banner={banner}
                                        onSave={(newBanner) => {
                                            const { banners } = this.state;
                                            banners[index] = newBanner;
                                            this.setState({ banners });
                                        }}
                                        onDelete={() => {
                                            const { banners } = this.state;
                                            banners.splice(index, 1);
                                            this.setState({ banners });
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="instruction-text">
                                You can include links markdown style, like [this](http://microsoft.com).
                                You must be a Project Collection Administrator to use this tool.
                            </div>
                        </div>
                    ) : (
                        <div className="no-data-view">
                            {this.state.loading === true
                                ? (
                                    <Spinner size={SpinnerSize.large} />
                                ) : (
                                    <ZeroData
                                        primaryText="No banners yet..."
                                        imageAltText="Icon"
                                        imagePath="../static/icon.png"
                                        actionText="Create a new banner"
                                        actionType={ZeroDataActionType.ctaButton}
                                        onActionClick={() => this.onAddBannerClicked()}
                                    />
                                )
                            }
                        </div>
                    )}
            </Page>
        );
    }

    private getCommandBarItems(): IHeaderCommandBarItem[] {
        return [
            {
                id: "add",
                text: "Add banner",
                isPrimary: true,
                iconProps: {
                    iconName: "Add",
                },
                onActivate: () => { this.onAddBannerClicked(); },
            },
            {
                id: "delete-all",
                text: "Delete all banners",
                iconProps: {
                    iconName: "Delete",
                },
                onActivate: () => { this.onDeleteAllClicked(); },
            },
            {
                id: "info",
                subtle: true,
                iconProps: {
                    iconName: "Info",
                },
                onActivate: () => { this.onAboutClicked(); },
                tooltipProps: {
                    text: "About Banner Settings",
                },
            },
        ];
    }

    private async deleteAllBanners(): Promise<void> {
        try {
            await AdoService.deleteWebGlobalMessageBanners();

            // Then make it reflect in the ui.
            this.setState({ banners: [] });
        } catch (ex) {
            this.setState({ errorText: `There was an error deleting all banners: ${ex.message}` });
        }
    }

    private onAddBannerClicked(): void {
        const { banners } = this.state;
        banners.push(new GlobalMessageBanner());
        this.setState({ banners });
    }

    private async onAboutClicked(): Promise<void> {
        const dialogService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        dialogService.openMessageDialog(
            `This is an open source project on Github.
            To contribute or review the code, please visit https://github.com/microsoft/banner-settings-ado-extension.
            Copyright Microsoft ${new Date().getFullYear()}`,
            {
                okText: "Close",
                showCancel: false,
                title: "About Banner Settings",
            },
        );
    }

    private async onDeleteAllClicked(): Promise<void> {
        const dialogService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        dialogService.openMessageDialog(
            "Are you sure you want to delete all banners?",
            {
                okText: "Yes",
                onClose: (result) => result === true ? this.deleteAllBanners() : null,
                showCancel: true,
                title: "Delete all banners",
            },
        );
    }
}

showRootComponent(<HubComponent />);
