
declare class BridgeHandler {
    event: string;
    id: number;
    callback: BridgeCallback;
}

interface BridgeCallback {
    (data: any): void;
}
