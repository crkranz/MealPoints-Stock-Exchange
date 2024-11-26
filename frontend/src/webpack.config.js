const webpack = require('webpack');

module.exports = {
    // other configurations...

    module: {
        rules: [
            {
                test: /\.js$/, // Apply Babel loader to all JS files
                exclude: /node_modules\/(?!chart.js)/, // Process chart.js and other modern JS libraries in node_modules
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'], // Transpile modern JavaScript and React
                        plugins: ['@babel/plugin-proposal-class-properties'], // Handle static class properties
                    },
                },
            },
        ],
    },

    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser', // Ensure compatibility with process
        }),
    ],
};
