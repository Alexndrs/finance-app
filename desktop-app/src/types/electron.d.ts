export { };

declare global {
    interface Window {
        electronAPI: {
            ping: () => void;
            onPong: (callback: (message: string) => void) => void;
        };
    }
}
