module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                        '@components': './src/components',
                        '@screens': './src/screens',
                        '@navigation': './src/navigation',
                        '@theme': './src/theme',
                        '@hooks': './src/hooks',
                        '@store': './src/store',
                        '@services': './src/services',
                        '@utils': './src/utils',
                        '@types': './src/types',
                        '@constants': './src/constants',
                        '@assets': './src/assets',
                        '@data': './src/data',
                        '@canvas': './src/canvas',
                    },
                    extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
