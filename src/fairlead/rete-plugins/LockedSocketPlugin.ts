import { ClassicPreset as ReteTypes, GetSchemes, BaseSchemes, Scope, NodeEditor } from 'rete'
import { FairLeadNode } from '../logic-presets/classic/nodes'
import { FairLeadOutput } from '../logic-presets/classic/outputs'
import { FairLeadInput } from '../logic-presets/classic/inputs'

export type ClassicScheme = GetSchemes<
  FairLeadNode,
  ReteTypes.Connection<FairLeadNode, FairLeadNode>
>

export type Requires =
  | { type: 'connectioncreate', data: {id: string, source: string, target: string, sourceOutput: string, targetInput: string} }
  | { type: 'connectionremove', data: {id: string, source: string, target: string, sourceOutput: string, targetInput: string} }


export class LockedSocketPlugin<Schemes extends ClassicScheme, K = Requires> extends Scope<unknown, [Requires | K]> {
  constructor() {
    super('locked-socket')
  }

  // this is triggered when calling editor.use(lockedSocketPlugin)
  setParent(scope: Scope<Requires | K>): void {
    super.setParent(scope)
    // let areaPlugin = this.parentScope<BaseAreaPlugin<Schemes, BaseArea<Schemes>>>(BaseAreaPlugin)
    // let editor = this.areaPlugin.parentScope<NodeEditor<Schemes>>(NodeEditor)
    let editor = this.parentScope<NodeEditor<Schemes>>(NodeEditor)

    this.addPipe(context => {
      if (!context || typeof context !== 'object' || !('type' in context)) return context

      if (context.type === 'connectioncreate') {
        let sourceNode = editor.getNode(context.data.source)
        let targetNode = editor.getNode(context.data.target)

        let output = sourceNode.outputs[context.data.sourceOutput] as FairLeadOutput;
        let input = targetNode.inputs[context.data.targetInput] as FairLeadInput;

        // TODO check if input already has an existing connection and whether we can "drop-in" replace it
        let x = 42;
      }
      else if (context.type === 'connectionremove') {
        let x = 42;

        let sourceNode = editor.getNode(context.data.source)
        let targetNode = editor.getNode(context.data.target)

        let output = sourceNode.outputs[context.data.sourceOutput] as FairLeadOutput;
        let input = targetNode.inputs[context.data.targetInput] as FairLeadInput;

        if (output.locked || input.locked) {
          console.log('prevented connection removal - locked')
          return false;
        }
      }
      return context
    })
  }
}