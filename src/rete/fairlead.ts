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

type Node = TextNode | FileNode | DataSourceNode | EntityNode;
type Conn =
  | Connection<TextNode, DataSourceNode>
  | Connection<FileNode, DataSourceNode>
type Schemes = GetSchemes<Node, Conn>;

class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> {}

class FileNode extends Classic.Node implements DataflowNode {
  width = 180;
  height = 150;
  constructor(initial?: File, change?: (value: File) => void) {
    super("File");

    this.addOutput('value', new Classic.Output(streamSocket, ''));
    this.addControl(
      'value',
      new FairLeadClassicLogicPreset.FairLeadFileControl({ initial, change })
    );
  }

  data(): Record<string, any> | Promise<Record<string, any>> {
    const value = (this.controls['value'] as FairLeadClassicLogicPreset.FairLeadFileControl).value?.stream();
    return {value}
  }

}

class DataSourceNode extends Classic.Node implements DataflowNode {
  // width = 180;
  // height = 120;

  // constructor(selectables: { name: string, inputs: string[]}[], public redraw: (type: any, id: string) => Promise<void>) {
  constructor(selectables: { name: string, inputs: string[]}[], public area: AreaPlugin<Schemes, AreaExtra>) {
    super("DataSource");

    // this.addInput('value', new Classic.Input(streamSocket, 'F|T'));
    this.addControl(
      'format',
      new FairLeadClassicLogicPreset.FairLeadSelectControl(selectables, { change: this.updateSelection.bind(this) })
    );
    this.addControl(
      'value',
      new FairLeadClassicLogicPreset.FairLeadTextControl({ readonly: true })
    );
  }

  updateSelection(value?: {name: string, inputs: string[] }) {
    const oldInputKeys = Object.keys(this.inputs || {})
    
    for (let connection of this.area.parent.connections) {
      if (connection.target == this.id && oldInputKeys.includes(connection.targetInput)) {
        this.area.parent.removeConnection(connection.id);
      }
    }
    
    for (let inputKey of oldInputKeys) {
      this.removeInput(inputKey);
    }

    for (let inputKey of value?.inputs || []) {
      this.addInput(inputKey, new Classic.Input(streamSocket, inputKey))
    }

    // this.redraw('node', this.id)
    this.area.update('node', this.id)
  }

  async data(inputs: Record<string, any>): Promise<Record<string, any> | Promise<Record<string, any>>> {
    
    const keys = Object.keys(inputs)
    let streamHeader = "";

    for (let inputKey of keys) {
      const stream: ReadableStream = inputs[inputKey][0];
      if (stream == undefined) {
        (this.controls['value'] as FairLeadClassicLogicPreset.FairLeadTextControl).setValue("");
        return {}
      }

      const reader = stream.getReader()
      const byteCountTarget = 5;
      let bytesReceived = 0;
      await reader.read().then(function processBytes({done, value}): Promise<ReadableStreamReadResult<any> | any> {
        if (value !== undefined) {
          bytesReceived += value.length
          streamHeader += value
        }
        
        if (done || bytesReceived >= byteCountTarget) {
          streamHeader = streamHeader.slice(0, byteCountTarget);
          return Promise.resolve();
        } 
        return reader.read().then(processBytes);
      });
    }

    (this.controls['value'] as FairLeadClassicLogicPreset.FairLeadTextControl).setValue(streamHeader);
    return {}
  }

}

class EntityNode extends Classic.Node implements DataflowNode {
  width = 180;
  height = 200;

  data(inputs: Record<string, any>): Record<string, any> | Promise<Record<string, any>> {
    throw new Error('Method not implemented.');
  }

}

class TextNode extends Classic.Node implements DataflowNode {
  width = 180;
  // height = 120;
  // title height + 1 * input height + 0 * output height + 1 * control height + bottom padding
  height = 48 + 1 * 36 + 0 * 36 + 1 * 52 + 6;

  constructor(initial: string, change?: (value?: string) => void) {
    super("Text");

    this.addOutput('value', new Classic.Output(streamSocket, 'Text'));
    this.addControl(
      'value',
      new FairLeadClassicLogicPreset.FairLeadTextControl({ initial, change })
    );
  }
  data() {
    const value = new Blob([(this.controls['value'] as FairLeadClassicLogicPreset.FairLeadTextControl).value || ""]).stream();

    return {
      value,
    };
  }
}

class AddNode extends Classic.Node implements DataflowNode {
  width = 180;
  height = 195;

  constructor() {
    super('Add');

    this.addInput('a', new Classic.Input(socket, 'A'));
    this.addInput('b', new Classic.Input(socket, 'B'));
    this.addOutput('value', new Classic.Output(socket, 'Text'));
    this.addControl(
      'result',
      new FairLeadClassicLogicPreset.FairLeadTextControl({ initial: "0", readonly: true })
    );
  }
  data(inputs: { a?: string[]; b?: string[] }) {
    const { a = [], b = [] } = inputs;
    const concat = (a[0] || "") + (b[0] || "");

    (this.controls['result'] as FairLeadClassicLogicPreset.FairLeadTextControl).setValue(concat);

    return {
      value: concat,
    };
  }
}

type AreaExtra =
  | Area2D<Schemes>
  | VueArea2D<Schemes>
  | ContextMenuExtra
  | MinimapExtra;

const socket = new Classic.Socket('socket');
const entitySocket = new Classic.Socket('entity');
const streamSocket = new Classic.Socket('stream');


export async function createEditor(container: HTMLElement) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);

  const vueRender = new VuePlugin<Schemes, AreaExtra>({
    setup: (context) => createApp(context).use(vuetify)
  });

  // const readonly = new ReadonlyPlugin<Schemes>();
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      ['Text', () => new TextNode("test", process)],
      ['Add', () => new AddNode()],
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

  editor.use(dataflow);

  const formats = [{name: 'SQL', inputs: ['connector']}]

  const a = new TextNode("hallo ", process);
  const b = new TextNode("welt", process);
  // const add = new AddNode();
  // const sourceNode = new DataSourceNode(formats, area.update.bind(area));
  const sourceNode = new DataSourceNode(formats, area);
  const fileNode = new FileNode(undefined, process);

  await editor.addNode(a);
  await editor.addNode(b);
  // await editor.addNode(add);
  await editor.addNode(fileNode);
  await editor.addNode(sourceNode);

  // await editor.addConnection(new Connection(fileNode, 'value', sourceNode, 'value'));

  // await editor.addConnection(new Connection(a, 'value', add, 'a'));
  // await editor.addConnection(new Connection(b, 'value', add, 'b'));

  // const arrange = new AutoArrangePlugin<Schemes>();

  // arrange.addPreset(ArrangePresets.classic.setup());

  // area.use(arrange);

  // await arrange.layout();

  AreaExtensions.zoomAt(area, editor.getNodes());

  AreaExtensions.simpleNodesOrder(area);

  const selector = AreaExtensions.selector();
  const accumulating = AreaExtensions.accumulateOnCtrl();

  AreaExtensions.selectableNodes(area, selector, { accumulating });

  async function process() {
    dataflow.reset();

    editor
      .getNodes()
      .filter((node) => node instanceof DataSourceNode)
      .forEach(async (node) => {
        const file = await dataflow.fetch(node.id);

        console.log(node.id, 'produces', file);

        area.update(
          'control',
          (node.controls['value'] as FairLeadClassicLogicPreset.FairLeadTextControl).id
        );
      });
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
