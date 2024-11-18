const webpack = require('webpack');

module.exports = {
    // other configurations...
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
};
