import { Scope } from 'rete'
import { classicConnectionPath, getDOMSocketPosition, loopConnectionPath, SocketPositionWatcher } from 'rete-render-utils'
import { ClassicScheme, RenderPreset, VueArea2D } from 'rete-vue-plugin'


import { DefineComponent } from 'vue'

import Connection from './components/FairLeadConnection.vue'
import ConnectionWrapper from './components/FairLeadConnectionWrapper.vue'
import FileControl from './components/FairLeadFileControl.vue'
import TextControl from './components/FairLeadTextControl.vue'
import DividerControl from './components/FairLeadDividerControl.vue'
import SelectControl from './components/FairLeadSelectControl.vue'
import Node from './components/FairLeadNode.vue'
import Socket from './components/FairLeadSocket.vue'

import FairLeadClassicLogicPreset from '../../logic-presets/classic'
//bimport { FairLeadSelectControl } from '@/fairlead/logic-presets/classic/controls'

// export { default as Connection } from './components/FairLeadConnection.vue'
// export { default as FileControl } from './components/FairLeadFileControl.vue'
// export { default as TextControl } from './components/FairLeadTextControl.vue'
// export { default as SelectControl } from './components/FairLeadSelectControl.vue'
// export { default as Node } from './components/FairLeadNode.vue'
// export { default as Socket } from './components/FairLeadSocket.vue'

type Position = {
  x: number;
  y: number;
};

type ExtractPayload<T extends ClassicScheme, K extends string> = Extract<VueArea2D<T>, {
  type: 'render';
  data: {
      type: K;
  };
}>['data'];

type Component<Props extends Record<string, any>> =
//  | VueConstructor<Vue<Record<string, any>, Props>>
  | DefineComponent<Props, any, any, any, any, any, any, any, any, any, any>

type CustomizationProps<Schemes extends ClassicScheme> = {
  node?: (data: ExtractPayload<Schemes, 'node'>) => Component<any> | null
  connection?: (data: ExtractPayload<Schemes, 'connection'>) => Component<any> | null
  socket?: (data: ExtractPayload<Schemes, 'socket'>) => Component<any> | null
  control?: (data: ExtractPayload<Schemes, 'control'>) => Component<any> | null
}
type ClassicProps<Schemes extends ClassicScheme, K> = {
  socketPositionWatcher?: SocketPositionWatcher<Scope<never, [K]>>,
  customize?: CustomizationProps<Schemes>
}

/**
 * Classic preset for rendering nodes, connections, controls and sockets.
 */
export function setup<Schemes extends ClassicScheme, K extends VueArea2D<Schemes>>(
  props?: ClassicProps<Schemes, K>
): RenderPreset<Schemes, K> {
  const positionWatcher = typeof props?.socketPositionWatcher === 'undefined'
    ? getDOMSocketPosition<Schemes, K>()
    : props?.socketPositionWatcher
  const { node, connection, socket, control } = props?.customize || {}

  return {
    attach(plugin) {
      positionWatcher.attach(plugin as unknown as Scope<never, [K]>)
    },
    update(context, plugin) {
      const { payload } = context.data
      const parent = plugin.parentScope()

      if (!parent) throw new Error('parent')
      const emit = parent.emit.bind(parent)

      if (context.data.type === 'node') {
        return { data: payload, emit }
      } else if (context.data.type === 'connection') {
        const { start, end } = context.data

        return {
          data: payload,
          ...(start ? { start } : {}),
          ...(end ? { end } : {})
        }
      }
      return { data: payload }
    },
    // eslint-disable-next-line max-statements, complexity
    render(context, plugin) {
      const parent = plugin.parentScope()
      const emit = parent.emit.bind(parent)

      if (context.data.type === 'node') {
        const component = node ? node(context.data) : Node
        const customEmit = (context.data.payload as FairLeadClassicLogicPreset.FairLeadNode).customEmitHandler.bind(context.data.payload)

        return component && {
          component, props: {
            data: context.data.payload,
            emit,
            customEmit
          }
        }
      } else if (context.data.type === 'connection') {
        const component = connection ? connection(context.data) : Connection
        const { payload } = context.data
        const { source, target, sourceOutput, targetInput } = payload

        return component && {
          component: ConnectionWrapper, props: {
            data: context.data.payload,
            component,
            start: context.data.start || ((change: any) => positionWatcher.listen(source, 'output', sourceOutput, change)),
            end: context.data.end || ((change: any) => positionWatcher.listen(target, 'input', targetInput, change)),
            path: async (start: Position, end: Position) => {
              const response = await plugin.emit({ type: 'connectionpath', data: { payload, points: [start, end] } })

              if (!response) return ''

              const { path, points } = response.data
              const curvature = 0.3

              if (!path && points.length !== 2) throw new Error('cannot render connection with a custom number of points')
              if (!path) return payload.isLoop
                ? loopConnectionPath(points as [Position, Position], curvature, 120)
                : classicConnectionPath(points as [Position, Position], curvature)

              return path
            }
          }
        }
      } else if (context.data.type === 'socket') {
        const { payload } = context.data
        const component = socket ? socket(context.data) : Socket

        return {
          component, props: {
            data: payload
          }
        }
      } else if (context.data.type === 'control') {
        const { payload } = context.data

        if (control) {
          const component = control(context.data)

          return component && {
            component, props: {
              data: payload
            }
          }
        }

        // if (context.data.payload instanceof FairLeadClassicLogicPreset.FairLeadFileControl) {
        //   return {
        //     component: FileControl,
        //     props: {
        //       data: payload
        //     }
        //   }
        // }

        if (context.data.payload instanceof FairLeadClassicLogicPreset.FairLeadTextControl) {
          return {
            component: TextControl,
            props: {
              data: payload
            }
          }
        }

        if (context.data.payload instanceof FairLeadClassicLogicPreset.FairLeadSelectControl) {
          return {
            component: SelectControl,
            props: {
              data: payload
            }
          }
        }

        if (context.data.payload instanceof FairLeadClassicLogicPreset.FairLeadDividerControl) {
          return {
            component: DividerControl,
            props: {
              data: payload
            }
          }
        }

        

        // if (context.data.payload instanceof FairLeadSelectControl) {
        //   return {
        //     component: SelectControl,
        //     props: {
        //       data: payload
        //     }
        //   }
        // }

        return null
      }
    }
  }
}
