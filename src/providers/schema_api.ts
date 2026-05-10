import { ClassDefinitionView, Configuration, EnhancementApi, Entity, EntityApi, Partition, PartitionApi, Schema, SchemaApi } from "schema_api";
import { SelectionProvider } from '@/fairlead/logic-presets/classic/controls'
import { reactive, ref, watch } from "vue";
import { entityGenerationSettings } from "./entity_generation_settings_provider";
import { useDebounceFn, UseDebounceFnReturn } from "./util";
import { useRoute } from "vue-router";

export class SchemaProvider implements SelectionProvider<Schema> {

    schemaApi: SchemaApi;

    constructor() {
        this.schemaApi = new SchemaApi()
    }

    async fetchSelectionOptions() {
        let schemas = await this.schemaApi.getAllSchemas()
        return schemas.map(schema => {
            return {
                label: schema.id || '',
                value: schema
            }
        })
    }

    async fetch() {
        return this.schemaApi.getAllSchemas()
    }
}

export class SchemaEntityProvider implements SelectionProvider<Entity> {
    entityApi: EntityApi;

    constructor(public schemaId: string) {
        this.entityApi = new EntityApi();
    }

    async fetchSelectionOptions() {
        let entities = await (await this.entityApi.getEntitiesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
        return entities.map(entity => {
            return {
                label: entity.entityName[0],
                value: entity
            }
        })
    }

    async fetchSelectionLabels() {
        let entities = await (await this.entityApi.getEntitiesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
        return entities.map(entity => entity.entityName[0])
    }
}

export class EntityProvider {
    entityApi: EntityApi;

    constructor(public schemaId: string) {
        this.entityApi = new EntityApi()
    }

    async fetch() {
        return (await this.entityApi.getEntitiesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value()
    }

    async fetchOne(entityId: string) {
        return (await this.entityApi.getEntityByIdRaw({schemaId: this.schemaId, entityId: entityId, ...entityGenerationSettings})).value();
    }
}


export class ClassProvider {
    schemaApi: SchemaApi;

    constructor(public schemaId: string) {
        this.schemaApi = new SchemaApi();
    }

    async fetch() {
        console.trace('Starting fetch of classes')
        return (await this.schemaApi.getClassesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
    }
}


class CachedClassProvider {
    classes: ClassDefinitionView[];
    debouncedFetch: UseDebounceFnReturn<(schemaId: string) => Promise<void>>;

    constructor() {
        this.classes = [];
        this.debouncedFetch = useDebounceFn(async (schemaId: string) => {
            const classProvider = new ClassProvider(schemaId);
            this.classes = await classProvider.fetch();
            const x = 42;
        }, 500, {maxWait: 3000, rejectOnCancel: false});
    }

    async fetchClasses(schemaId: string) {
        const classProvider = new ClassProvider(schemaId);
        this.classes = await classProvider.fetch();
    }

    async fetchClassesDebounced(schemaId: string) {
        await this.debouncedFetch(schemaId);
        const _ = 42;
    }
}

const cachedClassProvider = ref(new CachedClassProvider());

export {
    cachedClassProvider
}


const classNameList = ref<string[]>([]);
watch(() => cachedClassProvider.value.classes, (newClasses, oldClasses) => {
    classNameList.value = newClasses.map((x) => x.name);
},  { deep: true })
export { classNameList }


const legacyEntityNameList = ref<string[]>([]);
const route = useRoute();

watch(async () => route.fullPath, async (newPath, oldPath) => {
    if (route.name != 'not-found') {
        if (route.name == 'filtered-schema') {
            const provider = new SchemaEntityProvider(route.params.schemaId)
            legacyEntityNameList.value = await provider.fetchSelectionLabels()
        }
    }
})


const routeSensitiveClassNameList = ref<string[]>([]);
watch([legacyEntityNameList, classNameList], () => {
    if (route.name == 'filtered-schema') {
        routeSensitiveClassNameList.value = legacyEntityNameList.value;
    } else if (route.name == 'filtered-linkml-schema') {
        routeSensitiveClassNameList.value = classNameList.value;
    } else {
        routeSensitiveClassNameList.value = [];
    }
})
export { routeSensitiveClassNameList }



class CachedEntityProvider {
    entityApi: EntityApi;
    partitionApi: PartitionApi;
    partitions: Partition[];
    entities: Entity[];

    constructor() {
        this.entityApi = new EntityApi()
        this.partitionApi = new PartitionApi()
        this.entities = [];
        this.partitions = [];
    }

    async fetchEntities(schemaId: string) {
        this.entities = await (await this.entityApi.getEntitiesBySchemaRaw({ schemaId: schemaId, ...entityGenerationSettings })).value();
        // this.entities = await this.entityApi.getEntitiesBySchema(schemaId, ...entityGenerationSettings)
        // this.entities.length = 0  // truncate existing content
        // this.entities.push(...await this.entityApi.getEntitiesBySchema(schemaId))
    }

    async fetchFilteredEntities(schemaId: string, entityNames: string[]) {
        this.entities = await (await this.entityApi.getEntitiesBySchemaRaw({schemaId, entityFilter: entityNames, ...entityGenerationSettings})).value()
    }

    async fetchPartitions(schemaId: string) {
        this.partitions = await (await this.partitionApi.getPartitionedEntitiesBySchemaRaw({schemaId: schemaId, ...entityGenerationSettings})).value();
        this.entities = this.partitions[0].entities ?? [];
        // this.partitions.length = 0
        // this.partitions.push(...await this.partitionApi.getPartitionedEntitiesBySchema(schemaId));
        // this.entities.length = 0
        // this.entities.push(...this.partitions[0].entities)
    }

    switchPartition(partitionName: string) {
        const idx = this.partitions.findIndex((partition) => partition.title === partitionName)
        this.entities = this.partitions[idx].entities ?? []
    }
}

const cachedEntityProvider = reactive(new CachedEntityProvider());

export {cachedEntityProvider}


class CachedMappingProvider {
    // mappingApi: MappingApi;
    // mappings: Mapping[];
    mapping: string[] | null;

    constructor() {
        this.mapping = null;
    }

    async fetchMapping(mappingId: string) {
        this.mapping = await Promise.resolve(["123", "456"]);
    }

    clearMapping() {
        this.mapping = [];
    }
}

const cachedMappingProvider = reactive(new CachedMappingProvider());

export {cachedMappingProvider}

const config = new Configuration()
export const enhancementApi = new EnhancementApi(config);