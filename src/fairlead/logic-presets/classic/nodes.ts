import { ClassicPreset as ReteTypes, GetSchemes, NodeEditor, BaseSchemes, ConnectionBase, NodeBase } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { DataflowNode } from 'rete-engine';
import { FairLeadSelectControl, FairLeadTextControl, FairLeadDividerControl } from './controls';
import { CorrectionApi, Entity, Schema, SchemaApi } from 'schema_api';
import { EntityProvider, SchemaEntityProvider, SchemaProvider } from '@/providers/schema_api';
import { attributeSocket, streamSocket } from './sockets';
import { FairleadOutput } from './outputs';
import { reteSettings } from '@/providers/rete_settings_provider';


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

class FairLeadNode extends ReteTypes.Node {
    subLabel: string = '';
    private customEventHandlers: Map<string, CustomEventCallback> = new Map();
    
    // width = 280;

    public get height() {
        let height = 6;  // bottom padding
        
        if (Object.keys(this.controls).length > 0) height += 48; // header with settings button
        else height += 44; // header without settings button

        height += Object.keys(this.inputs).length * 36;
        height += Object.keys(this.outputs).length * 36;
        // height += Object.keys(this.controls).length * 52;  // controls are now in a dialog

        return Math.max(height, 70);  // make at least 70px high
    }

    get maxTextLength() {
        let combinedList = [
            ...Object.values(this.outputs).map(x => x.label.length),
            ...Object.values(this.inputs).map(x => x.label.length),
            Math.floor((this.label + this.subLabel).length * 1.6)
        ]
        // return Math.max(...combinedList.map(str => str.length));
        return Math.max(...combinedList);
    }

    public get size() {
        if (this.maxTextLength > 42) return 'huge';
        if (this.maxTextLength > 33) return 'large';
        if (this.maxTextLength > 24) return 'medium';
        return 'small'
    }

    public get width() {
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
            callback(message.payload)
        }
    }
}

export class EntityNode extends FairLeadNode implements DataflowNode {

    schemaProvider: SchemaProvider;
    entityProvider?: SchemaEntityProvider;

    constructor(options: FairLeadNodeOptions) {
        super("Entity", options)

        this.schemaProvider = new SchemaProvider();

        this.addControl('schema', new FairLeadSelectControl(this.schemaProvider, { change: this.selectSchema.bind(this) }))
    }

    async selectSchema(value?: {label: string, value: Schema }) {
        this.subLabel = '';
        this.deleteOutputs(Object.keys(this.outputs))
        this.removeControl('entity');
        this.entityProvider = undefined;

        if (value ?? false) {
            // a real schema was selected
            this.entityProvider = new SchemaEntityProvider(value?.label || '')
            this.addControl('entity', new FairLeadSelectControl(this.entityProvider, { change: this.selectEntity.bind(this) }))
        }

        this.options.updateUiComponent("node", this.id);
    }

    async selectEntity(value?: {label: string, value: Entity }) {
        this.subLabel = '';
        this.deleteOutputs(Object.keys(this.outputs))
        if (value ?? false) {
            // a real entity was selected
            this.subLabel = value?.label || '';
            for (let relation of value?.value.isSubjectInRelation || []) {
                const name = relation.relationName[0];
                this.addOutput(name, new ReteTypes.Output(streamSocket, name))
            }
        }

        this.options.updateUiComponent("node", this.id);
    }
    
    data(inputs: Record<string, any>): Record<string, any> | Promise<Record<string, any>> {
      return {} //throw new Error('Method not implemented.');
    }
  
  }

export class SchemaNode extends FairLeadNode implements DataflowNode {
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
        this.subLabel = '';
        this.deleteOutputs(Object.keys(this.outputs))
      

        if (value ?? false) {
            this.subLabel = value?.label || '';
            let entityProvider = new EntityProvider(value?.value.id || '')
            let entities = await entityProvider.fetch();
        
            for (let entity of entities || []) {
                const name = entity.entityName[0];
                this.addOutput(name, new ReteTypes.Output(streamSocket, name))
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

export class StaticEntityNode extends FairLeadNode {
    constructor(public entity: Entity, public schemaName: string, options: FairLeadNodeOptions) {
        let entityName = entity.entityName[0];

        super(`Entity - ${truncateTitle(entityName)}`, options)

        this.addCustomEvent('persistNameChanges', this.checkNameChanges.bind(this))

        this.addControl(
            'entity_name',
            new FairLeadTextControl({ initial: entityName, label: 'EntityName' })
        );

        this.addInput("self", new ReteTypes.Input(streamSocket, entityName))
        if (entity.isSubjectInRelation) {
            this.addControl('divider1', new FairLeadDividerControl())
        }
        for (let relation of entity.isSubjectInRelation ?? []) {
            let extendedRelationName = `${relation.relationName[0]}-${relation.hasObjectEntity}`;
            let relationName = relation.relationName[0];
            this.addOutput(extendedRelationName, new FairleadOutput(streamSocket, relation.relationName[0], false));
            this.addControl(`relation_${relationName}`, new FairLeadTextControl({initial: relationName, label: 'RelationName'}))
        }
        if (reteSettings.showAttributes) {
            if (entity.hasAttribute) {
                this.addControl('divider2', new FairLeadDividerControl())
            }
            for (let attribute of entity.hasAttribute ?? []) {
                const mods = attribute.hasAttributeModifier ?? [];
                const isKey = mods.find(mod => mod.attributeModifier == 'key') !== undefined;
                this.addOutput(attribute.attributeName[0], new FairleadOutput(attributeSocket, attribute.attributeName[0], isKey));
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
