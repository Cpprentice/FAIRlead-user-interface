import { ClassicPreset as ReteTypes } from 'rete';
import { ClassDefinitionView, SlotDefinitionView } from 'schema_api';

export class FairleadOutput extends ReteTypes.Output<ReteTypes.Socket> {
    constructor(socket: ReteTypes.Socket, label: string, public showUnderlined: boolean, public ref: [ClassDefinitionView, SlotDefinitionView] | null) {
        super(socket, label, true)
    }
}