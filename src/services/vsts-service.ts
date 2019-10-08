// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CommonServiceIds, ILocationService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";

import { GlobalMessageBanner, ObjectListWithCount, WebGlobalMessageBanner } from "../models/global-message-banners";

export class VstsService {
    private static instanceInternal: VstsService;
    private rootUrlCache: string;

    public static get instance(): VstsService {
        return this.instanceInternal == null ? new VstsService() : this.instanceInternal;
    }

    public async getWebGlobalMessageBanners(): Promise<GlobalMessageBanner[]> {
        const rootUrl = await this.getRootUrl();
        const accessToken = await SDK.getAccessToken();
        const url = `${rootUrl}_apis/settings/entries/host/GlobalMessageBanners?api-version=3.2-preview`;

        const response = await window.fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status < 200 || response.status >= 400) {
            throw new Error(response.statusText);
        }

        const responseString = await response.text();
        const webEntity = JSON.parse(responseString) as ObjectListWithCount<WebGlobalMessageBanner>;

        return GlobalMessageBanner.fromWebEntity(webEntity);
    }

    public async saveWebGlobalMessageBanner(banner: GlobalMessageBanner): Promise<void> {
        const webEntity = banner.toWebEntity();

        const rootUrl = await this.getRootUrl();
        const accessToken = await SDK.getAccessToken();
        const url = `${rootUrl}_apis/settings/entries/host?api-version=3.2-preview`;
        const response = await window.fetch(url, {
            method: "PATCH",
            body: JSON.stringify(webEntity),
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status < 200 || response.status >= 400) {
            throw new Error(response.statusText);
        }
    }

    public async deleteWebGlobalMessageBanner(banner: GlobalMessageBanner): Promise<void> {
        const entity = banner.toWebEntity();
        const title = Object.keys(entity)[0];

        const rootUrl = await this.getRootUrl();
        const accessToken = await SDK.getAccessToken();
        const url = `${rootUrl}_apis/settings/entries/host/${title}?api-version=3.2-preview`;
        const response = await window.fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status < 200 || response.status >= 400) {
            throw new Error(response.statusText);
        }
    }

    public async deleteWebGlobalMessageBanners(): Promise<void> {
        const rootUrl = await this.getRootUrl();
        const accessToken = await SDK.getAccessToken();
        const url = `${rootUrl}_apis/settings/entries/host/GlobalMessageBanners?api-version=3.2-preview`;
        const response = await window.fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status < 200 || response.status >= 400) {
            throw new Error(response.statusText);
        }
    }

    private async getRootUrl(): Promise<string> {
        if (this.rootUrlCache != null) {
            return this.rootUrlCache;
        }

        const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
        this.rootUrlCache = await locationService.getServiceLocation();
        return this.rootUrlCache;
    }
}
