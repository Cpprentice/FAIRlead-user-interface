<template>
    <v-container fluid style="margin-top: 64px;">
      <!-- tempoary v-model="true"-->
      <!--<v-navigation-drawer
        
        absolute
        location="right"
        width="300"
        :permanent="true"
        class="rete-nav-drawer"
      >-->
      <div class="rete-nav-drawer permanent-drawer">
        <v-list
          nav
          dense
        ><!--@update:selected="selected"-->
          <annotation-stats></annotation-stats>
          <v-list-item title="Automated Tuning" subtitle="section"></v-list-item>
          <enhancement-producer-dialog>
            <template v-slot:activator="{ props: activatorProps }">
              <v-list-item v-bind="activatorProps">
                <v-list-item-title><v-icon>mdi-plus</v-icon>Add</v-list-item-title>
              </v-list-item>
            </template>
          </enhancement-producer-dialog>
          <!--<v-list-item router to="/mappings/blub" title="Test"></v-list-item>-->
          <v-list-item v-for="listener in enhancement.producers" :title="listener.producerType"></v-list-item>
          <v-divider></v-divider>
          <v-list-item title="User Enhancements" subtitle="section"></v-list-item>
          
          <v-list-item v-for="operation in enhancement.operations">
            <v-list-item-title>{{ operation.operationType }}</v-list-item-title>
          </v-list-item>

          <v-card title="Semantic Annotation" v-if="attributeUnderAnnotation != null">
            <v-card-text>
              <v-form>
                <v-container class="pa-0">
                  <v-row>
                    <v-col>
                      <v-text-field
                        label="Attribute Name"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                        type="text"
                        :readonly="false"
                        v-model="newAttributeName"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <terminology-lookup @terminology-updated="setSelectedTerms"></terminology-lookup>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <unit-selection v-model="newUnit"></unit-selection>
                    </v-col>
                  </v-row>
                </v-container>
              </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="saveAnnotation">Save</v-btn>
            </v-card-actions>
          </v-card>
          <!--<v-divider></v-divider>
          <v-list-item title="Annotation" subtitle="section"></v-list-item>
          <v-list-item v-for="schema in schemaChoices" router :to="`/schemas/${schema}/annotation`">
            <v-list-item-title>{{ schema }}</v-list-item-title>
          </v-list-item>-->

      </v-list>
      </div>
      <!--</v-navigation-drawer>-->
      <main class="rete" ref="editorContainer"></main>
    </v-container>
</template>


<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { createEditor } from '../rete/fairleadAnnotation';
// import { Entity, EntityApi, FetchError } from 'schema_api';
import { cachedClassProvider, enhancementApi } from '../providers/schema_api';
import { loadingState } from '../providers/loading_state_provider';
import { ClassDefinitionView, SchemaEnhancement, GenericEnhancementOperation, OntologicalAnnotation, Unit } from 'schema_api';
import TerminologyLookup from './TerminologyLookup.vue';
import EnhancementProducerDialog from './EnhancementProducerDialog.vue';
import UnitSelection from './UnitSelection.vue';
import AnnotationStats from './AnnotationStats.vue';
import { attributeUnderAnnotation, classUnderAnnotation } from '@/providers/component_under_annotation';


type Destroyable = {
  destroy: () => void
}

const editorContainer = ref<HTMLElement | null>(null);

const route = useRoute();
const editor = ref<Destroyable | null>(null);

const automatedHandlerList = ['Attribute Renamer', 'Relation Detector', 'Attribute Annotator'];

const enhancement = ref<SchemaEnhancement>({operations: [], producers: []});

const newAnnotations = ref<OntologicalAnnotation[]>([]);
const newAttributeName = ref<string>('');
const newUnit = ref<Unit | undefined>(undefined);

function setSelectedTerms(terms: OntologicalAnnotation[]) {
  newAnnotations.value = terms;
}



watch(attributeUnderAnnotation, (attrib) => {
    if (attrib == null) {
      newAttributeName.value = '';
      newAnnotations.value = [];
      newUnit.value = undefined;
    } else {
      newAttributeName.value = attrib.name;
      newAnnotations.value = attrib.annotations ?? [];
      newUnit.value = attrib.unit;
    }
});

function annotationEquality(): boolean {
  let a = newAnnotations.value;
  let b = attributeUnderAnnotation.value?.annotations ?? [];
  if (a.length != b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].iri != b[i].iri) return false;
  }

  return true
}

async function saveAnnotation() {

  if (!annotationEquality()) {
    await enhancementApi.insertEnhancementOperation(route.params.schemaId, {
      operationType: 'AnnotateAttributeOperation',
      attributes: {
        class_name: classUnderAnnotation.value?.name,
        attribute_name: attributeUnderAnnotation.value?.name,
        annotations: newAnnotations.value
      }
    } as GenericEnhancementOperation)
  }
  if (newAttributeName.value !== attributeUnderAnnotation.value?.name) {
    await enhancementApi.insertEnhancementOperation(route.params.schemaId, {
      operationType: 'RenameAttributeOperation',
      attributes: {
        class_name: classUnderAnnotation.value?.name,
        old_name: attributeUnderAnnotation.value?.name,
        new_name: newAttributeName.value
      }
    })
  }
  if (newUnit.value?.id !== attributeUnderAnnotation.value?.unit?.id) {
    await enhancementApi.insertEnhancementOperation(route.params.schemaId, {
      operationType: 'AssignUnitOperation',
      attributes: {
        class_name: classUnderAnnotation.value?.name,
        attribute_name: attributeUnderAnnotation.value?.name,
        unit: newUnit.value
      }
    })
  }
  attributeUnderAnnotation.value = null;
  classUnderAnnotation.value = null;
}

onMounted(async () => {
  enhancement.value = await enhancementApi.getSchemaEnhancement(route.params.schemaId);
})


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
  width: calc(100vw - 450px - 32px);
  font-size: 1rem;
  background: white;
  border-radius: 1em;
  text-align: left;
  border: 3px solid #55b881;
  line-height: 1;
}

.rete-nav-drawer {
  height: calc(100vh - 64px)!important;
  top: 64px!important;
}

.permanent-drawer {
  position: absolute;
  right: 0px;
  width: 450px;
  overflow-y: auto;
}
</style>
