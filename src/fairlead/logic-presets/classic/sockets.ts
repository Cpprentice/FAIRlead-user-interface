import { ClassicPreset as ReteTypes } from 'rete';


export type MappingSocketKind = "Source" | "Target"
export enum SocketType {
    Attribute,
    Class,
    Relation,
    Schema
}

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

export function socketFactory<K extends MappingSocketKind>(kind: K, type: SocketType): FairLeadSocket {
    return new FairLeadSocket([
            kind.toLowerCase(),
            type.toString().toLowerCase()
        ].join('-')
    )
}

// these singletons are deprecated and will be removed eventually
export const streamSocket = new FairLeadSocket('stream');
export const attributeSocket = new FairLeadSocket('attribute');
export const schemaSocket = new FairLeadSocket('schema');
export const classSocket = new FairLeadSocket('class');
export const slotSocket = new FairLeadSocket('slot');
