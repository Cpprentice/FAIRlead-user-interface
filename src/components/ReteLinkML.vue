<template>
    <v-container fluid style="margin-top: 64px;">
      <main class="rete" ref="editorContainer"></main>
    </v-container>
</template>


<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { createEditor } from '../rete/fairleadLinkML';
import { cachedClassProvider } from '../providers/schema_api';
import { loadingState } from '../providers/loading_state_provider';
import { ClassDefinitionView } from 'schema_api';

const editorContainer = ref(null);

const route = useRoute();
const editor = ref(null);

watch(() => cachedClassProvider.value.classes, async (newClasses, oldClasses) => {
    await editorSetup(newClasses);
    loadingState.value = false
},  { deep: true })

async function editorSetup(classes: ClassDefinitionView[]) {
  if (editor.value != null) {
    editor.value.destroy();
  }
  editor.value = await createEditor(editorContainer.value, route.params.schemaId, classes);
}
</script>

<style scoped>
.rete {
  position: relative;
  height: calc(100vh - 64px - 32px);
  font-size: 1rem;
  background: white;
  border-radius: 1em;
  text-align: left;
  border: 3px solid #55b881;
  line-height: 1;
}
</style>
