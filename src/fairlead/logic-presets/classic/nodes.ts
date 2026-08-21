import { ClassicPreset as ReteTypes, GetSchemes, NodeEditor, BaseSchemes, ConnectionBase, NodeBase } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { DataflowNode } from 'rete-engine';
import { FairLeadSelectControl, FairLeadTextControl, FairLeadDividerControl, FairLeadControl, SelectOption, SelectionProvider, ExtendedSelectionProvider, ExtendedSelectionOption, FairLeadPreparedSelectControl, ValueType, FairLeadPreparedMultipleSelectControl } from './controls';
import { ClassDefinitionView, CorrectionApi, Entity, Schema, SchemaApi, SlotDefinitionView } from 'schema_api';
import { ClassProvider, EntityProvider, ExtendedSchemaProvider, SchemaClassProvider, SchemaEntityProvider, SchemaProvider, SchemaSlotProvider } from '@/providers/schema_api';
import { attributeSocket, classSocket, createAttributeSocket, createClassSocket, createSchemaSocket, createSlotSocket, createStreamSocket, FairLeadSocket, MappingSocketKind, schemaSocket, slotSocket, socketFactory, SocketType, streamSocket } from './sockets';
import { FairleadAnnotationOutput, FairLeadOutput } from './outputs';
import { reteSettings } from '@/providers/rete_settings_provider';
import { FairLeadInput } from './inputs';
import { measureText } from '@/providers/util';


export type FairLeadNodeOptions = {
    updateUiComponent(type: string, id: string): Promise<void>
    getConnections(): (ReteTypes.Connection<FairLeadNode, ReteTypes.Node> | ReteTypes.Connection<ReteTypes.Node, FairLeadNode>)[]
    removeConnection(id: string): Promise<boolean>
}

export type FairLeadCustomEmitMessage = {
    type: string,
    payload?: any
}
type CustomEventCallback = (payload: any) => void;

export abstract class FairLeadNode extends ReteTypes.Node {

    subLabels: string[] = [];
    metadata: Record<string, string> = {}
    abstract nodeType: string;
    private customEventHandlers: Map<string, CustomEventCallback> = new Map();
    
    // width = 280;

    public get locked(): boolean {
        const inputLock = Object.values(this.inputs).map(x => x as FairLeadInput).reduce((acc, x) => {return acc || (x?.locked || false)}, false)
        const outputLock = Object.values(this.outputs).map(x => x as FairLeadOutput).reduce((acc, x) => {return acc || (x?.locked || false)}, false)
        return inputLock || outputLock
    }

    public get height() {
        let height = 6;  // bottom padding
        
        if (Object.keys(this.controls).length > 0) height += 48; // header with settings button
        else height += 44; // header without settings button

        height += Object.keys(this.subLabels).length * 32; // Additional header row
        height += Object.keys(this.metadata).length * 24  // Metadata prop row
        height += Object.keys(this.metadata).length > 0 ? 16 : 0;  // Metadata list padding


        height += Object.keys(this.inputs).length * 36;
        height += Object.keys(this.outputs).length * 36;
        // height += Object.keys(this.controls).length * 52;  // controls are now in a dialog

        return Math.max(height, 70);  // make at least 70px high
    }

    get maxTextLength() {
        let maxInputAndOutputCharLength = Math.max(
            ...[
                ...Object.values(this.outputs).map(x => x?.label?.length || 0),
                ...Object.values(this.inputs).map(x => x?.label?.length || 0),
                0  //workaround for empty lists
            ]
        )

        const longestString = "W".repeat(maxInputAndOutputCharLength)
        const inputAndOutputStats = measureText(longestString, {
            fontSize: 14,
            fontFamily: "sans-serif"
        })

        const labelStats = measureText(this.label, {
            fontSize: 18,
            fontFamily: "sans-serif"
        })

        // TODO if we reuse the subLabels this needs to go here as well
        return Math.max(...[
            Math.ceil(inputAndOutputStats.width) + 2 + 18,  // text spacing + half socket
            Math.ceil(labelStats.width) + 2 + 8 + 32 + 16  // text spacing + gap + settingsIcon + row padding
        ])
    }

    public get size() {
        const requiredWidth = this.maxTextLength + 4;  // border
        if (requiredWidth > 350) return 'huge';
        if (requiredWidth > 280) return 'large';
        if (requiredWidth > 210) return 'medium';
        return 'small';
    }

    public get width() {
        // this likely needs to fit the CSS classes for size in the Vue Node Component
        switch (this.size) {
            case 'huge': return 420;
            case 'large': return 350;
            case 'small': return 210;
            default: return 280;
        }
    }

    constructor(label: string, public options: FairLeadNodeOptions) {
        super(label)
        
    }

    public addCustomEvent(eventType: string, callback: CustomEventCallback) {
        this.customEventHandlers.set(eventType, callback)
    }

    deleteInputs(inputNames: string[]) {
        for (let connection of this.options.getConnections()) {
            if (connection.target == this.id && inputNames.includes(connection.targetInput)) {
              this.options.removeConnection(connection.id);
            }
        }
          
        for (let inputKey of inputNames) {
            this.removeInput(inputKey);
        }
    }

    deleteOutputs(outputNames: string[]) {
        for (let connection of this.options.getConnections()) {
            if (connection.source == this.id && outputNames.includes(connection.sourceOutput)) {
              this.options.removeConnection(connection.id);
            }
        }
          
        for (let outputKey of outputNames) {
            this.removeOutput(outputKey);
        }
    }

    customEmitHandler(message: FairLeadCustomEmitMessage) {
        let callback = this.customEventHandlers.get(message.type)
        if (callback) {
            return callback(message.payload)
        }
    }

    static fromJson(json: any, options: FairLeadNodeOptions): FairLeadNode {
        let node: FairLeadNode | null = null;
        switch (json.type) {
            case 'Entity': node = new EntityNode(options); break;
            case 'Schema': node = new SchemaNode(options); break;
            default: throw new Error(`Unkown Node type: ${json.type}`)
        }

        for (let control of json.controls) {
            let existingControl = node.controls[control.key] as FairLeadControl<unknown>;
            existingControl.setValue(control.value);
        }
        return node;
    }

    toJson(): any {
        const controls = this.controls ?? {} as { [x: string]: FairLeadControl<unknown>};
        const controlData = Object.entries(controls).map(([key, obj]) => ({key, value: obj.value}));
        return {
            nodeType: this.nodeType,
            controls: controlData
        }
    }
}

export class GetSchemaNode extends FairLeadNode implements DataflowNode {
    nodeType = "GetSchema"
    // provider: SchemaProvider;
    provider: ExtendedSchemaProvider;

    constructor(options: FairLeadNodeOptions, public kind: MappingSocketKind) {
      super(`Get${kind}Schema`, options);
      // this.provider = new SchemaProvider();
      this.provider = new ExtendedSchemaProvider();

      this.addCustomEvent('output/connectioncreated', this.onConnectionCreated.bind(this))
      this.addCustomEvent('output/connectionremoved', this.onConnectionRemoved.bind(this))

      this.addControl(
        'schema',
        //new FairLeadSelectControl(this.provider, { change: this.updateSelection.bind(this) })
        new FairLeadPreparedSelectControl(this.provider, { change: this.updateSelection.bind(this) })
      );
    }

    data(inputs: Record<string, any>): Promise<Record<string, any>> | Record<string, any> {
        return {};
    }

    onConnectionCreated(payload: any) {
        let schemaControl = this.controls["schema"] as FairLeadPreparedSelectControl<unknown>;
        schemaControl.readonly = true;
    }

    onConnectionRemoved(payload: any) {
        let schemaControl = this.controls["schema"] as FairLeadPreparedSelectControl<unknown>;
        schemaControl.readonly = false;
    }

    async updateSelection(value?: {title: string, value: Schema, props: Record<string, any> }) {
        this.deleteOutputs(Object.keys(this.outputs))
      
        if (value ?? false) {
            this.addOutput("schema", new FairLeadOutput(socketFactory(this.kind, SocketType.Schema), value?.title || 'schema'))
        }
    
        this.options.updateUiComponent('node', this.id)
    }


}


abstract class PrerequisiteInputNode<SelectType> extends FairLeadNode {
    depth: number;
    selectProvider?: ExtendedSelectionProvider<SelectType>;

    constructor(
            label: string,
            options: FairLeadNodeOptions,
            public prerequisiteSlotName: string,
            private inputSocketFactory: () => FairLeadSocket,
            private outputSocketFactory: () => FairLeadSocket
    ) {
        super(label, options)
        this.depth = 0;

        this.addInput(prerequisiteSlotName, new FairLeadInput(inputSocketFactory(), prerequisiteSlotName))

        this.addCustomEvent("input/connectioncreated", this.onInputConnectionCreated.bind(this))
        this.addCustomEvent("output/connectioncreated", this.onOutputConnectionCreated.bind(this))
        this.addCustomEvent("input/connectionremove", this.onInputConnectionRemove.bind(this))
        this.addCustomEvent("input/connectionremoved", this.onInputConnectionRemoved.bind(this))
        this.addCustomEvent("output/connectionremoved", this.onOutputConnectionRemoved.bind(this))
    }

    abstract createProvider(payload: any): ExtendedSelectionProvider<SelectType>;

    selectItem(options?: ExtendedSelectionOption<SelectType>[]) {
        if (options === undefined) {
            this.deleteOutputs(Object.keys(this.outputs));
            return;
        }
        console.log('options', options)
        let labelsToKeep = options.map(x => x.title);
        console.log('keep', labelsToKeep)
        let outputKeysToDelete = Object.keys(this.outputs).filter(x => !labelsToKeep.includes(x))
        let outputKeysToAdd = labelsToKeep.filter(x => !Object.keys(this.outputs).includes(x))
        this.deleteOutputs(outputKeysToDelete)
        // this.subLabels = this.subLabels.slice(0, this.depth);
        // if (option) {
        //     this.addOutput(option.label, new ReteTypes.Output(this.outputSocket, option.label))
        //     this.subLabels.push(option.label)
        // }
        for (let option of options) {
            if (outputKeysToAdd.includes(option.title)) {
                this.addOutput(option.title, new FairLeadOutput(this.outputSocketFactory(), option.title))
            }
        }

        (this.inputs[this.prerequisiteSlotName] as FairLeadInput).locked = Object.keys(this.outputs).length > 0;

        this.options.updateUiComponent('node', this.id)
    }

    onOutputConnectionRemoved(payload: any) {
        // this.locked = false;
        (this.controls["select"] as FairLeadPreparedMultipleSelectControl<unknown>).enableItem(payload.outputName);
        const localOutput = this.outputs[payload.outputName] as FairLeadOutput;
        localOutput.locked = false;
        this.options.updateUiComponent("node", this.id)
    }

    onInputConnectionCreated(payload: any) {
        
        this.depth = payload.sourceNode.subLabels.length;
        this.subLabels = [...payload.sourceNode.subLabels]
        const helper: Record<string, string> = {}
        helper[this.prerequisiteSlotName] = payload.sourceNode.outputs[payload.outputName].label;
        this.metadata = {...payload.sourceNode.metadata, ...helper}
        this.selectProvider = this.createProvider(payload);
        // this.selectProvider = new SchemaClassProvider(payload.sourceNode.subLabels[0]);
        this.addControl('select', new FairLeadPreparedMultipleSelectControl(this.selectProvider, { change: this.selectItem.bind(this), label: 'Make choice' }))
        this.options.updateUiComponent("node", this.id);
        // this.options.updateUiComponent("control", this.controls["class"]?.id ?? '')
    }

    onOutputConnectionCreated(payload: any) {
        // this.locked = true;
        (this.controls["select"] as FairLeadPreparedMultipleSelectControl<unknown>).disableItem(payload.outputName);
        const localOutput = this.outputs[payload.outputName] as FairLeadOutput;
        localOutput.locked = true;
        this.options.updateUiComponent("node", this.id)
    }

    onInputConnectionRemove(payload: any) {
        return !(this.inputs[payload.inputName] as FairLeadInput).locked
        return !this.locked;
        // if (this.controls) {
        //     let classControl = this.controls["class"] as FairLeadSelectControl<unknown>;
        //     if (classControl.value) {
        //         let classOutput = this.outputs[classControl.value?.label || ''];

        //     }
        // }
    }

    onInputConnectionRemoved(payload: any) {
        this.selectProvider = undefined;
        this.removeControl("select")
        this.deleteOutputs(Object.keys(this.outputs));
        this.subLabels = [];
        this.metadata = {};
        this.options.updateUiComponent("node", this.id);
    }

}


export class GetClassesNode extends PrerequisiteInputNode<ClassDefinitionView> implements DataflowNode {
    
    nodeType = 'GetClasses'
    // classProvider?: SchemaClassProvider;
    // locked: boolean

    constructor(options: FairLeadNodeOptions, public kind: MappingSocketKind) {
        super(`Get${kind}Classes`, options, "schema", () => socketFactory(kind, SocketType.Schema), () => socketFactory(kind, SocketType.Class))
        // this.locked = false;
        // this.addInput("schema", new ReteTypes.Input(schemaSocket, "schema"))  // prerequisite

        // this.addCustomEvent("input/connectioncreated", this.onInputConnectionCreated.bind(this))
        // this.addCustomEvent("output/connectioncreated", this.onOutputConnectionCreated.bind(this))
        // this.addCustomEvent("input/connectionremove", this.onInputConnectionRemove.bind(this))
        // this.addCustomEvent("input/connectionremoved", this.onInputConnectionRemoved.bind(this))
        // this.addCustomEvent("output/connectionremoved", this.onOutputConnectionRemoved.bind(this))
    }

    createProvider(payload: any): ExtendedSelectionProvider<ClassDefinitionView> {
        return new SchemaClassProvider(this.metadata["schema"]);
    }

    data(inputs: Record<string, any>): Promise<Record<string, any>> | Record<string, any> {
        return {}  // throw new Error('Method not implemented.');
    }
}


export class GetSlotsNode extends PrerequisiteInputNode<SlotDefinitionView> implements DataflowNode {
    
    nodeType = 'GetSlots'

    constructor(options: FairLeadNodeOptions) {
        super("GetSlots", options, "class", createClassSocket, createSlotSocket)
    }

    createProvider(payload: any): ExtendedSelectionProvider<SlotDefinitionView> {
        return new SchemaSlotProvider(this.metadata["schema"], this.metadata["class"]);
    }

    data(inputs: Record<string, any>): Promise<Record<string, any>> | Record<string, any> {
        return {}
    }
}

export class EntityNode extends FairLeadNode implements DataflowNode {
    nodeType = 'Entity'
    schemaProvider: SchemaProvider;
    entityProvider?: SchemaEntityProvider;

    constructor(options: FairLeadNodeOptions) {
        super("Entity", options)

        this.schemaProvider = new SchemaProvider();

        this.addControl('schema', new FairLeadSelectControl(this.schemaProvider, { change: this.selectSchema.bind(this) }))
    }

    async selectSchema(value?: {label: string, value: Schema }) {
        this.subLabels = [];
        this.deleteOutputs(Object.keys(this.outputs))
        this.removeControl('entity');
        this.entityProvider = undefined;

        if (value ?? false) {
            // a real schema was selected
            this.entityProvider = new SchemaEntityProvider(value?.label || '')
            this.addControl('entity', new FairLeadSelectControl(this.entityProvider, { change: this.selectEntity.bind(this) }))
            this.subLabels.push(value?.label || '')
        }

        this.options.updateUiComponent("node", this.id);
    }

    async selectEntity(value?: {label: string, value: Entity }) {
        this.subLabels = this.subLabels.slice(0, 1);
        this.deleteOutputs(Object.keys(this.outputs))
        if (value ?? false) {
            // a real entity was selected
            this.subLabels.push(value?.label || '');
            for (let relation of value?.value.isSubjectInRelation || []) {
                const name = relation.relationName[0];
                this.addOutput(name, new ReteTypes.Output(createStreamSocket(), name))
            }
        }

        this.options.updateUiComponent("node", this.id);
    }
    
    data(inputs: Record<string, any>): Record<string, any> | Promise<Record<string, any>> {
      return {} //throw new Error('Method not implemented.');
    }
  
  }

export class SchemaNode extends FairLeadNode implements DataflowNode {
    nodeType = 'Schema'
    provider: SchemaProvider;

    constructor(options: FairLeadNodeOptions) {
      super("Schema", options);

      this.provider = new SchemaProvider();
  
      // this.addInput('value', new Classic.Input(streamSocket, 'F|T'));
      this.addControl(
        'name',
        new FairLeadSelectControl(this.provider, { change: this.updateSelection.bind(this) })
      );
    //   this.addControl(
    //     'value',
    //     new FairLeadTextControl({ readonly: true })
    //   );
    }
  
    async updateSelection(value?: {label: string, value: Schema }) {
        this.subLabels = [];
        this.deleteOutputs(Object.keys(this.outputs))
      

        if (value ?? false) {
            this.subLabels.push(value?.label || '');
            let entityProvider = new EntityProvider(value?.value.id || '')
            let entities = await entityProvider.fetch();
        
            for (let entity of entities || []) {
                const name = entity.entityName[0];
                this.addOutput(name, new ReteTypes.Output(createStreamSocket(), name))
            }
        }
    
        // this.redraw('node', this.id)
        this.options.updateUiComponent('node', this.id)
    }
  
    async data(inputs: Record<string, any>): Promise<Record<string, any> | Promise<Record<string, any>>> {
        return {}
      
    //   const keys = Object.keys(inputs)
    //   let streamHeader = "";
  
    //   for (let inputKey of keys) {
    //     const stream: ReadableStream = inputs[inputKey][0];
    //     if (stream == undefined) {
    //       (this.controls['value'] as FairLeadTextControl).setValue("");
    //       return {}
    //     }
  
    //     const reader = stream.getReader()
    //     const byteCountTarget = 5;
    //     let bytesReceived = 0;
    //     await reader.read().then(function processBytes({done, value}): Promise<ReadableStreamReadResult<any> | any> {
    //       if (value !== undefined) {
    //         bytesReceived += value.length
    //         streamHeader += value
    //       }
          
    //       if (done || bytesReceived >= byteCountTarget) {
    //         streamHeader = streamHeader.slice(0, byteCountTarget);
    //         return Promise.resolve();
    //       } 
    //       return reader.read().then(processBytes);
    //     });
    //   }
  
    //   (this.controls['value'] as FairLeadTextControl).setValue(streamHeader);
    //   return {}
    }
  
}

function truncateTitle(title: string) {
    if (title.length > 21) {
        return `${title.slice(0, 9)}...${title.slice(-9)}`
    }
    return title
}


export class ClassAnnotationNode extends FairLeadNode {
    nodeType = 'ClassAnnotation'

    constructor(public class_: ClassDefinitionView, public schemaName: string, options: FairLeadNodeOptions) {
        let className = class_.name;

        super(`Class - ${truncateTitle(className)}`, options)

        // this.addCustomEvent('persistNameChanges', this.checkNameChanges.bind(this))

        this.addControl(
            'class_name',
            new FairLeadTextControl({ initial: className, label: 'ClassName' })
        );

        this.addInput("self", new ReteTypes.Input(createStreamSocket(), className))
        if (class_.relations) {
            this.addControl('divider1', new FairLeadDividerControl())
        }
        for (const [key, relation] of Object.entries(class_.relations) as [string, SlotDefinitionView][]) {
        //for (let [relationKey, relation] of class_.relations ?? {}) {
            let extendedRelationName = `${relation.name}-${relation.range}`;
            let relationName = relation.name;
            this.addOutput(extendedRelationName, new FairleadAnnotationOutput(createStreamSocket(), relationName, false, [class_, relation]));
            this.addControl(`relation_${relationName}`, new FairLeadTextControl({initial: relationName, label: 'RelationName'}))
        }
        if (reteSettings.showAttributes) {
            if (class_.attributes) {
                this.addControl('divider2', new FairLeadDividerControl())
            }
            for (const [key, attribute] of Object.entries(class_.attributes) as [string, SlotDefinitionView][]) {
                // const mods = attribute.hasAttributeModifier ?? [];
                const isKey = attribute.key;
                this.addOutput(attribute.name, new FairleadAnnotationOutput(createAttributeSocket(), attribute.name, isKey, [class_, attribute]));
                this.addControl(`attribute_${attribute.name}`, new FairLeadTextControl({initial: attribute.name, label: 'AttributeName'}))
            }
        }
    }
}

export class StaticClassNode extends FairLeadNode {
    nodeType = 'StaticClass'
    constructor(public cls: ClassDefinitionView, public schemaName: string, options: FairLeadNodeOptions) {

        super(`Class - ${truncateTitle(cls.name)}`, options)

        this.addInput("self", new ReteTypes.Input(createStreamSocket(), cls.name))
        for (const [key, relation] of Object.entries(cls.relations) as [string, SlotDefinitionView][]) {
            let extendedRelationName = `${relation.name}-${relation.range}`;
            let relationName = relation.name;
            this.addOutput(extendedRelationName, new FairleadAnnotationOutput(createStreamSocket(), relationName, false, [cls, relation]));
        }
        if (reteSettings.showAttributes) {
            for (const [key, attribute] of Object.entries(cls.attributes) as [string, SlotDefinitionView][]) {
                const isKey = attribute.key;
                this.addOutput(attribute.name, new FairleadAnnotationOutput(createAttributeSocket(), attribute.name, isKey, [cls, attribute]));
            }
        }
    }
}

export class StaticEntityNode extends FairLeadNode {
    nodeType = 'StaticEntity'
    constructor(public entity: Entity, public schemaName: string, options: FairLeadNodeOptions) {
        let entityName = entity.entityName[0];

        super(`Entity - ${truncateTitle(entityName)}`, options)

        this.addCustomEvent('persistNameChanges', this.checkNameChanges.bind(this))

        this.addControl(
            'entity_name',
            new FairLeadTextControl({ initial: entityName, label: 'EntityName' })
        );

        this.addInput("self", new ReteTypes.Input(createStreamSocket(), entityName))
        if (entity.isSubjectInRelation) {
            this.addControl('divider1', new FairLeadDividerControl())
        }
        for (let relation of entity.isSubjectInRelation ?? []) {
            let extendedRelationName = `${relation.relationName[0]}-${relation.hasObjectEntity}`;
            let relationName = relation.relationName[0];
            this.addOutput(extendedRelationName, new FairleadAnnotationOutput(createStreamSocket(), relation.relationName[0], false, null));
            this.addControl(`relation_${relationName}`, new FairLeadTextControl({initial: relationName, label: 'RelationName'}))
        }
        if (reteSettings.showAttributes) {
            if (entity.hasAttribute) {
                this.addControl('divider2', new FairLeadDividerControl())
            }
            for (let attribute of entity.hasAttribute ?? []) {
                const mods = attribute.hasAttributeModifier ?? [];
                const isKey = mods.find(mod => mod.attributeModifier == 'key') !== undefined;
                this.addOutput(attribute.attributeName[0], new FairleadAnnotationOutput(createAttributeSocket(), attribute.attributeName[0], isKey, null));
                this.addControl(`attribute_${attribute.attributeName[0]}`, new FairLeadTextControl({initial: attribute.attributeName[0], label: 'AttributeName'}))
            }
        }
    }

    async checkNameChanges() {
        let correctionApi = new CorrectionApi();
        let entityName = this.entity.entityName[0];
        for (let [key, control] of Object.entries(this.controls)) {
            if (key.startsWith('entity_')) {
                let newName = (control as FairLeadTextControl).value ?? '';
                if (newName != entityName) {
                    await correctionApi.changeEntityNameCorrection(this.schemaName, entityName, newName)
                    entityName = newName
                    this.entity.entityName = [entityName, ...this.entity.entityName]
                }
            } else if (key.startsWith('attribute_')) {
                let oldName = key.slice(10)
                let newName = (control as FairLeadTextControl).value ?? '';
                let attribute = this.entity.hasAttribute?.find((attr) => attr.attributeName[0] == oldName)
                if (newName != attribute?.attributeName[0]) {
                    await correctionApi.changeAttributeNameCorrection(this.schemaName, entityName, oldName, newName)
                    attribute.attributeName = [newName, ...attribute?.attributeName ?? []]
                }
            } else if (key.startsWith('relation_')) {
                let oldName = key.slice(9)
                let newName = (control as FairLeadTextControl).value ?? '';
                let relation = this.entity.isSubjectInRelation?.find((rel) => rel.relationName[0] == oldName)
                if (newName != relation?.relationName[0]) {
                    await correctionApi.changeRelationNameCorrection(this.schemaName, entityName, oldName, newName)
                    relation.relationName = [newName, ...relation?.relationName ?? []]
                }
            }
        }
    }

    // async renameEntity(activeEntityName: string, newEntityName: string) {
    //     let correctionApi = new CorrectionApi();
    //     await correctionApi.changeEntityNameCorrection("test_data_source", activeEntityName, newEntityName)  // TODO fix hardcoded schema
    // }
}


// export class LinkMLNode extends FairLeadNode {
    
// }
