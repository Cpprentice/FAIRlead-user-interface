import { ClassicPreset as ReteTypes } from 'rete';

export class FairLeadSocket extends ReteTypes.Socket {
    locked: boolean
    constructor(name: string) {
        super(name);
        this.locked = false;
    }
}

export const createStreamSocket = () => new FairLeadSocket('stream');
export const createAttributeSocket = () => new FairLeadSocket('attribute');
export const createSchemaSocket = () => new FairLeadSocket('schema');
export const createClassSocket = () => new FairLeadSocket('class');
export const createSlotSocket = () => new FairLeadSocket('slot');
export const createRelationSocket = () => new FairLeadSocket('relation');

export const streamSocket = new FairLeadSocket('stream');
export const attributeSocket = new FairLeadSocket('attribute');
export const schemaSocket = new FairLeadSocket('schema');
export const classSocket = new FairLeadSocket('class');
export const slotSocket = new FairLeadSocket('slot');
