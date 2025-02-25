import { ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete';

import { Area2D, AreaExtensions, AreaPlugin } from 'rete-area-plugin';

import { VuePlugin, VueArea2D, Presets as VuePresets } from 'rete-vue-plugin';

import { DataflowEngine, DataflowNode } from 'rete-engine';
import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
} from 'rete-auto-arrange-plugin';
import { ReadonlyPlugin } from 'rete-readonly-plugin';
import {
  ContextMenuPlugin,
  ContextMenuExtra,
  Presets as ContextMenuPresets,
} from 'rete-context-menu-plugin';
import { MinimapExtra, MinimapPlugin } from 'rete-minimap-plugin';
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from 'rete-connection-plugin';

import { Classic as FairLeadClassicUiPreset } from '../fairlead/ui-presets'
import { Classic as FairLeadClassicLogicPreset } from '../fairlead/logic-presets'
import vuetify from '@/plugins/vuetify';
import { createApp } from 'vue';
import { EntityNode, FairLeadNodeOptions, SchemaNode, StaticEntityNode } from '@/fairlead/logic-presets/classic/nodes';
import { EntityProvider, SchemaProvider } from '@/providers/schema_api';
import { CorrectionApi, Entity } from 'schema_api';

// type Node = TextNode | FileNode | DataSourceNode | EntityNode | SchemaNode<AreaPlugin<any>>;
type Node = EntityNode | SchemaNode | StaticEntityNode;
type Conn =
  | Connection<EntityNode, EntityNode>
  | Connection<SchemaNode, EntityNode>
  | Connection<StaticEntityNode, StaticEntityNode>
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

const socket = new Classic.Socket('socket');
const entitySocket = new Classic.Socket('entity');
const streamSocket = new Classic.Socket('stream');

function getStringIndex(input_string: string, search_string: string, occurrence: number = 0) {
  return input_string.split(search_string, occurrence).join(search_string).length;
}

function getEntityIdFromUrl(url_string: string) {
  const url = new URL(url_string);
  const idx = getStringIndex(url.pathname, '/', 4)
  return decodeURIComponent(url.pathname.substring(idx + 1))
}


export async function createEditor(container: HTMLElement, schemaName: string, entities: Entity[]) {
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
      ['Entity', () => new EntityNode(fairleadOptions)],
      ['Schema', () => new SchemaNode(fairleadOptions)],
    ]),
  });
//  const minimap = new MinimapPlugin<Schemes>();
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();

  // editor.use(readonly.root);
  editor.use(area);
  // area.use(readonly.area);

  area.use(vueRender);

  area.use(connection);
  connection.addPreset(ConnectionPresets.classic.setup());

  area.use(contextMenu);
//  area.use(minimap);

  console.log(typeof(FairLeadClassicUiPreset.Node))
  // vueRender.addPreset(VuePresets.classic.setup());
  vueRender.addPreset(FairLeadClassicUiPreset.setup());
  vueRender.addPreset(VuePresets.contextMenu.setup());
  vueRender.addPreset(VuePresets.minimap.setup());

  const dataflow = new DataflowEngine<Schemes>();

  // editor.use(dataflow);

  const formats = [{name: 'SQL', inputs: ['connector']}]

  let nodeLookup = new Map<string, StaticEntityNode>();

  for (let entity of entities) {
    let node = new StaticEntityNode(entity, schemaName, fairleadOptions);
    for (let name of entity.entityName) {
      nodeLookup.set(name, node);
    }
    await editor.addNode(node);
  }

  for (let entity of entities) {
    for (let relation of entity.isSubjectInRelation ?? []) {
      let subject_name = getEntityIdFromUrl(relation.hasSubjectEntity)
      let object_name = getEntityIdFromUrl(relation.hasObjectEntity)
      let a = nodeLookup.get(subject_name) as StaticEntityNode;
      let b = nodeLookup.get(object_name) as StaticEntityNode;
      let outputName = `${relation.relationName[0]}-${relation.hasObjectEntity}`;
      if (b == undefined) {
        console.log(`Output: ${outputName} could not be created target is undefined`)
      } else {
        let connection = new Connection(a, outputName, b, "self")
        await editor.addConnection(connection);
      }
    }
  }

  const arrange = new AutoArrangePlugin<Schemes>();

  arrange.addPreset(ArrangePresets.classic.setup());

  area.use(arrange);

  await arrange.layout();

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
    return context;
  });

  process();

  // readonly.enable();

  return {
    destroy: () => area.destroy(),
  };
}
