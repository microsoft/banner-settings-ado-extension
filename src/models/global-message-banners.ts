// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/* tslint:disable:max-classes-per-file */

const toHtmlConfigs: ReplacementConfig[] = [
    { regex: /\*\*([^\*\*]+)\*\*/g, replaceWith: "<strong>$1</strong>" },  // Bold
    { regex: /\*([^\*]+)\*/g, replaceWith: "<em>$1</em>" },  // Italic
    { regex: /\[([^[\]]+)\]\(([^()]+)\)/g, replaceWith: "<a href='$2'>$1</a>" }  // Links
];

const toMarkdownConfigs: ReplacementConfig[] = [
    { regex: /<strong>([^<]+)<\/strong>/g, replaceWith: "**$1**" },  // Bold
    { regex: /<em>([^<]+)<\/em>/g, replaceWith: "*$1*" },  // Italic
    { regex: /<a href=["']([^<>]+)["']>([^<>]+)<\/a>/g, replaceWith: "[$2]($1)" }  // Links  
];

export enum Priority {
    p0, p1, p2,
}

export enum Level {
    Info, Warning, Error,
}

// Define a configuration interface for replacements
interface ReplacementConfig {
    regex: RegExp;
    replaceWith: string;
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
            banner.message = this.replaceMultipleFormats(body.message, toMarkdownConfigs),
            banner.level = Level[this.fixTypeCase(body.level)];
            banner.expirationDate = body.expirationDate != null ? new Date(body.expirationDate) : null;
            bannerList.push(banner);
        });
        return bannerList;
    }

    public static replaceMultipleFormats(message: string, configs: ReplacementConfig[]): string {
        return configs.reduce((acc, config) => acc.replace(config.regex, config.replaceWith), message);
    }

    public toWebEntity(): { [name: string]: WebGlobalMessageBanner } {
        const ret: { [name: string]: WebGlobalMessageBanner } = {};
        const title = `GlobalMessageBanners/${Priority[this.priority]}-${this.messageId}`;

        ret[title] = {
            level: Level[this.level],
            message: GlobalMessageBanner.replaceMultipleFormats(this.message, toMarkdownConfigs),
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
    public value: { [name: string]: T };
}
