<template lang="pug">
.node(:class="[{ selected: data.selected }, data.label.toLowerCase(), data.size ]" :style="nodeStyles()" data-testid="node")
    .title(data-testid="title")
        v-row
          v-col.justify-space-between.align-self-center
            span {{nodeTitle}}
          v-col.justify-space-between.v-col-auto
            v-dialog(max-width="500")
              template(v-slot:activator="{ props: activatorProps }")
                v-btn(
                  @pointerdown.stop=""
                  v-bind="activatorProps"
                  size="x-small"
                  icon="mdi-cog-outline"
                  data-testid="settings-button"
                  v-show="hasControl"
                )
              template(v-slot:default="{ isActive }")
                v-card(:title="settingDialogHeader")
                  v-card-text
                      // Controls
                      Ref.control(
                        v-for='[key, control] in controls()',
                        :key="'control' + key + seed",
                        :data-testid="'control-'+key"
                        :emit="emit"
                        :data="{ type: 'control', payload: control }"
                      )
                  v-card-actions
                    v-spacer
                    v-btn(
                      text="Save"
                      @click="customEmit({type: 'persistNameChanges'})"
                    )
                    v-btn(
                      text="Close Dialog"
                      @click="isActive.value = false"
                    )

    // Outputs
    .output(v-for='[key, output] in outputs()' :key="'output' + key + seed" :data-testid="'output-'+key")
        .output-title.output-key(data-testid="output-title", v-if="output.showUnderlined") {{output.label}}
        .output-title(data-testid="output-title", v-if="!output.showUnderlined") {{output.label}}
        Ref.output-socket(
            :data="{ type: 'socket', side: 'output', key: key, nodeId: data.id, payload: output.socket }"
            :emit="emit"
            data-testid="output-socket")

    //- // Controls
    //- Ref.control(
    //- v-for='[key, control] in controls()',
    //- :key="'control' + key + seed",
    //- :data-testid="'control-'+key"
    //- :emit="emit"
    //- :data="{ type: 'control', payload: control }"
    //- )

    // Inputs
    .input(v-for='[key, input] in inputs()' :key="'input' + key + seed" :data-testid="'input-'+key")
        Ref.input-socket(
            :data="{ type: 'socket', side: 'input', key: key, nodeId: data.id, payload: input.socket }"
            :emit="emit"
            data-testid="input-socket"
        )
        .input-title(v-show='!input.control || !input.showControl' data-testid="input-title") {{input.label}}
        Ref.input-control(
            v-show='input.control && input.showControl'
            :emit="emit"
            :data="{ type: 'control', payload: input.control }"
            data-testid="input-control"
        )
</template>
    
    
<script lang="js">
import { defineComponent } from 'vue'
import Ref from './Ref.vue'

function sortByIndex(entries) {
    entries.sort((a, b) => {
        const ai = a[1] && a[1].index || 0
        const bi = b[1] && b[1].index || 0

        return ai - bi
    })
    return entries
}

export default defineComponent({
    props: ['data', 'emit', 'seed', 'customEmit'],
    methods: {
        nodeStyles() {
            return {
            width: Number.isFinite(this.data.width) ? `${this.data.width}px` : '',
            height: Number.isFinite(this.data.height) ? `${this.data.height}px` : ''
            }
        },
        inputs() {
            return sortByIndex(Object.entries(this.data.inputs))
        },
        controls() {
            return sortByIndex(Object.entries(this.data.controls))
        },
        outputs() {
            return sortByIndex(Object.entries(this.data.outputs))
        }
    },
    components: {
        Ref
    },
    computed: {
      hasControl() {
        return Object.keys(this.data.controls).length > 0
      },
      settingDialogHeader() {
        return `${this.data.label} - Settings`
      },
      nodeTitle() {
        if (this.data.subLabel ?? false) {
          return `${this.data.label} - ${this.data.subLabel}`
        }
        return this.data.label
      }
    }
})
</script>
    
<style lang="scss" scoped>
    @use "sass:math";
    @import "../vars";
    
    .node {
      background: $node-color;
      // border: 2px solid #4e58bf;
      border: 2px solid black;
      border-radius: 5px;
      cursor: pointer;
      box-sizing: border-box;
      width: $node-width;
      height: auto;
      padding-bottom: 6px;
      position: relative;
      user-select: none;
      line-height: initial;
      font-family: Arial;
    
      &:hover {
        background: lighten($node-color, 4%);
      }
    
      &.selected {
        // background: $node-color-selected;
        // border-color: #e3c000;
        background: darken($node-color, 10%);
      }

      &.selected:hover {
        background: darken($node-color, 4%);
      }
    
      .title {
        // color: white;
        font-family: sans-serif;
        font-size: 18px;
        padding: 8px;
      }
    
      .output {
        text-align: right;
      }
    
      .input {
        text-align: left;
      }
    
      .output-socket {
        text-align: right;
        margin-right: -(math.div($socket-size, 2) + $socket-margin);
        display: inline-block;
      }
    
      .input-socket {
        text-align: left;
        margin-left: -(math.div($socket-size, 2) + $socket-margin);
        display: inline-block;
      }
    
      .input-title,
      .output-title {
        vertical-align: middle;
        // color: white;
        display: inline-block;
        font-family: sans-serif;
        font-size: 14px;
        margin: $socket-margin;
        line-height: $socket-size;
        //max-width: 240px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        //direction: rtl;
      }

      &.small {
        .input-title,
        .output-title {
          max-width: 170px;
        }
      }

      &.medium {
        .input-title,
        .output-title {
          max-width: 240px;
        }
      }

      &.large {
        .input-title,
        .output-title {
          max-width: 310px;
        }
      }

      &.huge {
        .input-title,
        .output-title {
          max-width: 380px;
        }
      }
    
      .input-control {
        z-index: 1;
        width: calc(100% - #{$socket-size + 2*$socket-margin});
        vertical-align: middle;
        display: inline-block;
      }
    
      .control {
        padding: $socket-margin math.div($socket-size, 2) + $socket-margin;
      }

      .output-key.output-title {
        text-decoration-line: underline;
      }
    }
    .v-card-text .control {
      margin-top: 1em !important;
    }
</style>
