import { ClassicPreset as ReteTypes } from 'rete';

class FairLeadSocket extends ReteTypes.Socket {
    locked: boolean
    constructor(name: string) {
        super(name);
        this.locked = false;
    }
}

export const streamSocket = new FairLeadSocket('stream');
export const attributeSocket = new FairLeadSocket('attribute');
export const schemaSocket = new FairLeadSocket('schema');
export const classSocket = new FairLeadSocket('class');
export const slotSocket = new FairLeadSocket('slot');
