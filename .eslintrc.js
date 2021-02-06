module.exports = {
    root: true,
    env: {
        es2021: true
    },
    extends: [
        '@react-native-community',
        'plugin:react/recommended',
        'plugin:rxjs/recommended',
        'airbnb-typescript',
        'prettier',
        'prettier/@typescript-eslint',
        'prettier/react'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 12,
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: [],
    rules: {
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error'],
        'no-param-reassign': ['error', {props: false}]
    }
};
