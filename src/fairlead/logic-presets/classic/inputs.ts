import { ClassicPreset as ReteTypes } from 'rete';
import { FairLeadSocket } from './sockets';

export class FairLeadInput extends ReteTypes.Input<FairLeadSocket> {
    public get locked(): boolean {
        return this.socket.locked;
    }

    public set locked(lockState: boolean) {
        this.socket.locked = lockState;
    }
}