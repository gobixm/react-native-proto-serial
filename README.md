# react-native-proto-serial

USB to UART embedded device communitcation library

## Installation

```sh
npm install react-native-proto-serial
```

## Usage

```js
const device = new SerialDevice();
const deviceService = new DeviceService(
    device,
    new ProtoSerializer<MessageBase>(MessageBase.decode, MessageBase.encode)
);

deviceService.request$<IAboutResponse>(
                MessageBase.create({
                    aboutRequest: {}
                }),
                (x) => x.aboutResponse
            )
            .subscribe((response) => console.log('response: ', response));

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
