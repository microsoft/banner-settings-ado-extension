// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/* tslint:disable:max-classes-per-file */

const markdownLinkRegex = /\[([^\[\]]+)\]\(([^\(\)]+)\)/g;
const aTagLinkRegex = /<a href=["']([^<>]+)["']>([^<>]+)<\/a>/g;

export enum Priority {
    p0, p1, p2,
}

export enum Level {
    Info, Warning, Error,
}

export class GlobalMessageBanner {
    public priority: Priority;
    public level: Level;
    public messageId: string;
    public message: string;
    public expirationDate: Date;

    public constructor() {
        this.priority = Priority.p2;
        this.level = Level.Info;
        this.messageId = ((new Date()).getTime() % Number.MAX_SAFE_INTEGER).toString();
        this.message = "";
        this.expirationDate = null;
    }

    private static fixTypeCase(type: string): string {
        type = type.toLocaleLowerCase();
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    public static fromWebEntity(entity: ObjectListWithCount<WebGlobalMessageBanner>): GlobalMessageBanner[] {
        if (entity == null && entity.value == null) {
            return null;
        }

        const bannerList: GlobalMessageBanner[] = [];
        Object.keys(entity.value).forEach((title) => {
            const banner = new GlobalMessageBanner();
            const body = entity.value[title];
            banner.priority = Priority[title.slice(0, 2)];
            banner.messageId = title.slice(3);
            banner.message = body.message.replace(aTagLinkRegex, `[$2]($1)`);
            banner.level = Level[this.fixTypeCase(body.level)];
            banner.expirationDate = body.expirationDate != null ? new Date(body.expirationDate) : null;
            bannerList.push(banner);
        });
        return bannerList;
    }

    public toWebEntity(): {[name: string]: WebGlobalMessageBanner} {
        const ret: {[name: string]: WebGlobalMessageBanner} = {};
        const title = `GlobalMessageBanners/${Priority[this.priority]}-${this.messageId}`;

        ret[title] = {
            level: Level[this.level],
            message: this.message.replace(markdownLinkRegex, `<a href='$2'>$1</a>`),
        };

        if (this.expirationDate != null) {
            ret[title].expirationDate = this.expirationDate != null
                ? new Date(this.expirationDate).toISOString() : null;
        }

        return ret;
    }
}

export class WebGlobalMessageBanner {
    public level: string;
    public message: string;
    public expirationDate?: string;
}

export class ObjectListWithCount<T> {
    public count: number;
    public value: {[name: string]: T};
}
