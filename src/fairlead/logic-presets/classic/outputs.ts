import { ClassicPreset as ReteTypes } from 'rete';
import { ClassDefinitionView, SlotDefinitionView } from 'schema_api';
import { FairLeadSocket } from './sockets';


export class FairLeadOutput extends ReteTypes.Output<FairLeadSocket> {
    public get locked(): boolean {
        return this.socket.locked;
    }

    public set locked(lockState: boolean) {
        this.socket.locked = lockState;
    }

    constructor(socket: FairLeadSocket, label?: string, multipleConnections?: boolean) {
        super(socket, label, multipleConnections)
    }
}

export class FairleadAnnotationOutput extends FairLeadOutput {
    constructor(socket: FairLeadSocket, label: string, public showUnderlined: boolean, public ref: [ClassDefinitionView, SlotDefinitionView] | null) {
        super(socket, label, true)
    }
}