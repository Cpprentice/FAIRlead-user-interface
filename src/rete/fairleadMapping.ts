import { ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete';

import { Area2D, AreaExtensions, AreaPlugin } from 'rete-area-plugin';

import { VuePlugin, VueArea2D, Presets as VuePresets } from 'rete-vue-plugin';

import { DataflowEngine, DataflowNode } from 'rete-engine';
// import {
//   AutoArrangePlugin,
//   Presets as ArrangePresets,
// } from 'rete-auto-arrange-plugin';
// import { ReadonlyPlugin } from 'rete-readonly-plugin';
import {
  ContextMenuPlugin,
  ContextMenuExtra,
  Presets as ContextMenuPresets,
} from 'rete-context-menu-plugin';
import { MinimapExtra, MinimapPlugin } from 'rete-minimap-plugin';
import {
  ClassicFlow,
  ConnectionPlugin,
  Presets as ConnectionPresets,
  getSourceTarget,
} from 'rete-connection-plugin';

import { Classic as FairLeadClassicUiPreset } from '../fairlead/ui-presets'
import { Classic as FairLeadClassicLogicPreset } from '../fairlead/logic-presets'
import vuetify from '@/plugins/vuetify';
import { createApp } from 'vue';
import { EntityNode, FairLeadNodeOptions, GetSchemaNode, SchemaNode, FairLeadNode, GetSlotsNode, GetClassesNode } from '@/fairlead/logic-presets/classic/nodes';
import { EntityProvider, SchemaProvider } from '@/providers/schema_api';
import { ImportExportInterface, importExportProvider } from '@/providers/import_export_provider';
import { LockedSocketPlugin } from '@/fairlead/rete-plugins/LockedSocketPlugin';
// import { CorrectionApi, Entity } from 'schema_api';

// type Node = TextNode | FileNode | DataSourceNode | EntityNode | SchemaNode<AreaPlugin<any>>;
type Node = EntityNode | SchemaNode | GetClassesNode | GetSchemaNode | GetSlotsNode;
type Conn =
  | Connection<EntityNode, EntityNode>
  | Connection<SchemaNode, EntityNode>
  | Connection<SchemaNode, GetClassesNode>
  | Connection<GetSchemaNode, GetClassesNode>
  | Connection<GetClassesNode, GetSlotsNode>
type Schemes = GetSchemes<Node, Conn>;

class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> {}

type AreaExtra =
  | Area2D<Schemes>
  | VueArea2D<Schemes>
  | ContextMenuExtra
  | MinimapExtra;

// const socket = new Classic.Socket('socket');
// const entitySocket = new Classic.Socket('entity');
// const streamSocket = new Classic.Socket('stream');

function getStringIndex(input_string: string, search_string: string, occurrence: number = 0) {
  return input_string.split(search_string, occurrence).join(search_string).length;
}

function getEntityIdFromUrl(url_string: string) {
  const url = new URL(url_string);
  const idx = getStringIndex(url.pathname, '/', 4)
  return decodeURIComponent(url.pathname.substring(idx + 1))
}


type Sockets = Classic.Socket;
type Input = Classic.Input<Sockets>;
type Output = Classic.Output<Sockets>;

function getConnectionSockets(
  editor: NodeEditor<Schemes>,
  connection: Schemes["Connection"]
) {
  const source = editor.getNode(connection.source);
  const target = editor.getNode(connection.target);

  const output =
    source &&
    (source.outputs as Record<string, Input>)[connection.sourceOutput];
  const input =
    target && (target.inputs as Record<string, Output>)[connection.targetInput];

  return {
    source: output?.socket,
    target: input?.socket
  };
}


export async function createEditor(container: HTMLElement, mappingName: string, mapping: string[]) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);

  const fairleadOptions: FairLeadNodeOptions = {
    updateUiComponent: area.update.bind(area),
    getConnections: editor.getConnections.bind(editor),
    removeConnection: editor.removeConnection.bind(editor)
  }

  const vueRender = new VuePlugin<Schemes, AreaExtra>({
    setup: (context) => createApp(context).use(vuetify)
  });

  // const readonly = new ReadonlyPlugin<Schemes>();
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      // ['Entity', () => new EntityNode(fairleadOptions)],
      // ['Schema', () => new SchemaNode(fairleadOptions)],
      ['GetSourceSchema', () => new GetSchemaNode(fairleadOptions, "Source")],
      ['GetTargetSchema', () => new GetSchemaNode(fairleadOptions, "Target")],
      ['GetSourceClasses', () => new GetClassesNode(fairleadOptions, "Source")],
      ['GetTargetClasses', () => new GetClassesNode(fairleadOptions, "Target")],
      ['GetSlots', () => new GetSlotsNode(fairleadOptions)]
    ]),
  });
  const minimap = new MinimapPlugin<Schemes>();
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();

  // editor.use(readonly.root);
  editor.use(area);
  // area.use(readonly.area);

  area.use(vueRender);

  area.use(connection);
  // connection.addPreset(ConnectionPresets.classic.setup());
  connection.addPreset(
    () =>
      new ClassicFlow({
        canMakeConnection(from, to) {
          // this function checks if the old connection should be removed
          const [source, target] = getSourceTarget(from, to) || [null, null];

          if (!source || !target || from === to) return false;

          const sockets = getConnectionSockets(
            editor,
            new Connection(
              editor.getNode(source.nodeId),
              source.key as never,
              editor.getNode(target.nodeId),
              target.key as never
            )
          );
          console.log(sockets);

          if (sockets.source?.name !== sockets.target?.name) {
            console.log("Sockets are not compatible", "error");
            connection.drop();
            return false;
          }

          return Boolean(source && target);
        }
      })
  );

  area.use(contextMenu);
  area.use(minimap);

  // vueRender.addPreset(VuePresets.classic.setup());
  vueRender.addPreset(FairLeadClassicUiPreset.setup());
  vueRender.addPreset(VuePresets.contextMenu.setup());
  vueRender.addPreset(VuePresets.minimap.setup());

  const dataflow = new DataflowEngine<Schemes>();

  // editor.use(dataflow);

  const lockedSocketHandler = new LockedSocketPlugin()
  editor.use(lockedSocketHandler)

  const formats = [{name: 'SQL', inputs: ['connector']}]

  for (let sourceNode of mapping) {
      let node = new SchemaNode(fairleadOptions);
    //   for (let name of entity.entityName) {
    //     nodeLookup.set(name, node);
    //   }
      await editor.addNode(node);
    }
  
    // for (let entity of entities) {
    //   for (let relation of entity.isSubjectInRelation ?? []) {
    //     let subject_name = getEntityIdFromUrl(relation.hasSubjectEntity)
    //     let object_name = getEntityIdFromUrl(relation.hasObjectEntity)
    //     let a = nodeLookup.get(subject_name) as StaticEntityNode;
    //     let b = nodeLookup.get(object_name) as StaticEntityNode;
    //     let outputName = `${relation.relationName[0]}-${relation.hasObjectEntity}`;
    //     if (b == undefined) {
    //       console.log(`Output: ${outputName} could not be created target is undefined`)
    //     } else {
    //       let connection = new Connection(a, outputName, b, "self")
    //       await editor.addConnection(connection);
    //     }
    //   }
    // }


  AreaExtensions.zoomAt(area, editor.getNodes());

  AreaExtensions.simpleNodesOrder(area);

  const selector = AreaExtensions.selector();
  const accumulating = AreaExtensions.accumulateOnCtrl();

  AreaExtensions.selectableNodes(area, selector, { accumulating });

  async function process() {
    dataflow.reset();

    // editor
    //   .getNodes()
    //   .filter((node) => node instanceof DataSourceNode)
    //   .forEach(async (node) => {
    //     const file = await dataflow.fetch(node.id);

    //     console.log(node.id, 'produces', file);

    //     area.update(
    //       'control',
    //       (node.controls['value'] as FairLeadClassicLogicPreset.FairLeadTextControl).id
    //     );
    //   });
  }

  editor.addPipe((context) => {
    if (
      context.type === 'connectioncreated' ||
      context.type === 'connectionremoved'
    ) {
      process();
    }

    let callbackOutputs = [];

    if (context.type === 'connectioncreated') {
      let sourceNode = editor.getNode(context.data.source) as FairLeadNode;
      let targetNode = editor.getNode(context.data.target) as FairLeadNode;
      callbackOutputs.push(sourceNode.customEmitHandler({
        type: "output/connectioncreated",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          targetNode: targetNode,
          connectionId: context.data.id
        }
      }));
      callbackOutputs.push(targetNode.customEmitHandler({
        type: "input/connectioncreated",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          sourceNode: sourceNode,
          connectionId: context.data.id
        }
      }));
    } else if (context.type === 'connectionremoved') {
      let sourceNode = editor.getNode(context.data.source) as FairLeadNode;
      let targetNode = editor.getNode(context.data.target) as FairLeadNode;
      callbackOutputs.push(sourceNode.customEmitHandler({
        type: "output/connectionremoved",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          targetNode: targetNode,
          connectionId: context.data.id
        }
      }));
      callbackOutputs.push(targetNode.customEmitHandler({
        type: "input/connectionremoved",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          sourceNode: sourceNode,
          connectionId: context.data.id
        }
      }));
    } else if (context.type == 'connectioncreate') {
      let sourceNode = editor.getNode(context.data.source) as FairLeadNode;
      let targetNode = editor.getNode(context.data.target) as FairLeadNode;
      callbackOutputs.push(sourceNode.customEmitHandler({
        type: "output/connectioncreate",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          targetNode: targetNode,
          connectionId: context.data.id
        }
      }));
      callbackOutputs.push(targetNode.customEmitHandler({
        type: "input/connectioncreate",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          sourceNode: sourceNode,
          connectionId: context.data.id
        }
      }));
    } else if (context.type == 'connectionremove') {
      let sourceNode = editor.getNode(context.data.source) as FairLeadNode;
      let targetNode = editor.getNode(context.data.target) as FairLeadNode;
      callbackOutputs.push(sourceNode.customEmitHandler({
        type: "output/connectionremove",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          targetNode: targetNode,
          connectionId: context.data.id
        }
      }));
      callbackOutputs.push(targetNode.customEmitHandler({
        type: "input/connectionremove",
        payload: {
          outputName: context.data.sourceOutput,
          inputName: context.data.targetInput,
          sourceNode: sourceNode,
          connectionId: context.data.id
        }
      }));
    }

    callbackOutputs = callbackOutputs.filter(x => x !== undefined)  // keep only defined outputs

    if (callbackOutputs.length > 0) {
      return callbackOutputs[0]
    }

    return context;
  });

  process();

  // readonly.enable();

  async function performExport(): Promise<string> {
    const nodes = editor.getNodes();
    const nodeData = nodes.map(x => x.toJson());
    for (let i = 0; i < nodes.length; ++i) {
      nodeData[i]['position'] = area.nodeViews.get(nodes[i].id)?.position ?? {x: 0, y: 0}
    }
    return JSON.stringify(nodeData, null, 4);
  }

  async function performImport(jsonData: string): Promise<void> {
    
  }

  importExportProvider.setHandler({
    performExport: performExport,
    performImport: performImport
  } as ImportExportInterface)

  return {
    destroy: () => area.destroy(),
  };
}
