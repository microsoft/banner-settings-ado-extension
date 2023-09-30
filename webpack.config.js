// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = (env, argv) => {
    const config = {
        entry: {
            Hub: './src/hub.tsx'
        },
        devtool: argv.mode === 'development' ? 'source-map' : false,
        output: {
            filename: "[name]/[name].js",
            path: path.join(__dirname, 'dist'),
            publicPath: "/dist/"
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            alias: {
                "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk"),
                "src": path.resolve(__dirname, "src"),
                "wcf-config": path.resolve(__dirname, './src/Common/Configuration/Configuration.' + argv.mode),
            },
        },
        stats: {
            warnings: false
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader"
                },
                {
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "sass-loader",
                        "azure-devops-ui/buildScripts/css-variables-loader",
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                    ],
                },
                {
                    test: /\.woff$/,
                    use: [{
                        loader: 'base64-inline-loader'
                    }]
                },
                {
                    test: /\.html$/,
                    loader: "file-loader"
                }
            ]
        },
        devServer: {
            port: 44405,
            hot: true,
            http2: true,
            static: {
                directory: path.join(__dirname, './'),
                serveIndex: true,
            }
        },
        plugins: [
            new CopyWebpackPlugin([
                { from: "**/*.html", context: "src/" },
            ]),
            new MiniCssExtractPlugin({
                filename: "[name]/[name].css",
            }),
        ]

    }

    if (argv.mode === 'production') {
        config.optimization.minimizer.push(new CssMinimizerPlugin())
    }

    return config;
};
