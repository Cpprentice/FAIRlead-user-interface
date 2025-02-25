import { ClassicPreset as ReteTypes } from 'rete';

export class FairleadOutput extends ReteTypes.Output<ReteTypes.Socket> {
    constructor(socket: ReteTypes.Socket, label: string, public showUnderlined: boolean) {
        super(socket, label, true)
    }
}